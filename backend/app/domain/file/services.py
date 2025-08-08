import uuid
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any

import csv

import aiofiles
import pandas as pd
from loguru import logger
from fastapi import UploadFile, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload,joinedload
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk

from app.core.config import settings
from app.core.db import async_session_maker
from app.domain.file import models, schemas
from app.domain.user.models import User
from app.domain.project.models import Project as AnalyzerProject
from app.domain.analyzer.models import AnalyzerGraph
from app.domain.analyzer.services import convert_graph_to_es_analyzer

from app.core.exceptions import (
    UnsupportedFormatError,
    FileTooLargeError,
    FileReadingError,
    FileAlreadyExistsError,
    SaveError,
    ResourceNotFoundError,
    ForbiddenError,
    AppException,
    FileParsingError,
    IngestionError
)

# --- Constantes ---
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class FileValidator:
    """Valide un fichier uploadé sur plusieurs critères en utilisant des exceptions métier."""

    def __init__(self, db: AsyncSession, dataset, file: UploadFile):
        self.db = db
        self.dataset = dataset
        self.file = file
        self.content: Optional[bytes] = None

    async def validate(self) -> bytes:
        """Exécute toutes les validations et retourne le contenu du fichier si tout est OK."""
        self._validate_extension()
        self.content = await self.file.read()
        self._validate_size()
        await self._validate_uniqueness()
        return self.content

    def _validate_extension(self):
        """Valide que l'extension du fichier est autorisée."""
        file_ext = Path(self.file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise UnsupportedFormatError()

    def _validate_size(self):
        """Valide que la taille du fichier ne dépasse pas la limite."""
        if len(self.content) > MAX_FILE_SIZE:
            raise FileTooLargeError()

    async def _validate_uniqueness(self):
        """Valide que le fichier n'est pas un doublon dans le dataset."""
        file_hash = hashlib.sha256(self.content).hexdigest()
        result = await self.db.execute(
            select(models.File).where(models.File.dataset_id == self.dataset.id, models.File.hash == file_hash)
        )
        if result.scalars().first():
            raise FileAlreadyExistsError()


class FileService:
    """Service pour tout le cycle de vie d'un Fichier."""

    async def get_owned_by_user(self, db: AsyncSession, file_id: uuid.UUID, user: User) -> models.File:
        """Récupère un fichier et vérifie la propriété via le dataset parent."""
        file = await db.get(models.File, file_id)
        if not file:
            raise ResourceNotFoundError("Fichier non trouvé.")
        
        await db.refresh(file, attribute_names=['dataset'])
        if file.dataset.owner_id != user.id:
            raise ForbiddenError("Accès non autorisé à ce fichier.")
        return file

    async def upload(self, db: AsyncSession, dataset, file: UploadFile, uploader: User) -> models.File:
        """Valide, stocke et enregistre un nouveau fichier."""
        validator = FileValidator(db, dataset, file)
        content = await validator.validate()

        file_hash = hashlib.sha256(content).hexdigest()
        result = await db.execute(select(func.max(models.File.version)).where(models.File.dataset_id == dataset.id))
        version = (result.scalar_one_or_none() or 0) + 1

        extension = Path(file.filename).suffix
        stored_name = f"{dataset.id}_v{version}{extension}"
        folder = settings.UPLOAD_DIR / str(dataset.id)
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / stored_name

        try:
            async with aiofiles.open(path, 'wb') as f:
                await f.write(content)
        except Exception as e:
            logger.error(f"Erreur de sauvegarde du fichier physique : {e}")
            raise SaveError()

        new_file = models.File(
            dataset_id=dataset.id,
            filename_original=file.filename,
            filename_stored=stored_name,
            version=version,
            hash=file_hash,
            size_bytes=len(content),
            uploader_id=uploader.id,
            status=models.FileStatus.PENDING
        )
        
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        
        logger.info(f"Fichier {new_file.id} uploadé. Prêt pour le parsing.")
        return new_file

    async def remove(self, db: AsyncSession, file_id: uuid.UUID):
        """Supprime un fichier de la DB et du stockage physique."""
        file_to_delete = await db.get(models.File, file_id)
        if file_to_delete:
            # S'assure que la relation dataset est chargée pour obtenir le chemin
            await db.refresh(file_to_delete, attribute_names=['dataset'])
            
            # Construit le chemin vers le fichier stocké
            storage_path = settings.UPLOAD_DIR / str(file_to_delete.dataset_id) / file_to_delete.filename_stored
            
            # Supprime le fichier physique s'il existe
            if storage_path.exists():
                storage_path.unlink()
                logger.info(f"Fichier physique {storage_path} supprimé.")
            
            # Supprime l'entrée de la base de données
            await db.delete(file_to_delete)
            await db.commit()
            logger.info(f"Fichier ID {file_id} supprimé de la base de données.")


class TaskService:
    """Contient la logique métier destinée à être exécutée par des workers de tâches de fond."""

    def _infer_schema_from_dataframe(self, df: pd.DataFrame) -> Dict[str, str]:
        schema = {}
        for col, dtype in df.dtypes.items():
            if "int" in str(dtype):
                schema[col] = "integer"
            elif "float" in str(dtype):
                schema[col] = "float"
            elif "datetime" in str(dtype):
                schema[col] = "datetime"
            else:
                schema[col] = "string"
        return schema

    def _create_data_preview(self, df: pd.DataFrame, num_rows: int = 5) -> List[Dict[str, Any]]:
        """
        Génère un aperçu des premières lignes d'un DataFrame.
        Convertit les données en un format compatible JSON.
        """
        preview_df = df.head(num_rows)
        # Remplace les valeurs NaN (non sérialisables en JSON) par None
        preview_df = preview_df.where(pd.notna(preview_df), None)
        return preview_df.to_dict(orient='records')

    async def parse_file(self, file_id: uuid.UUID):
        """Tâche de parsing d'un fichier avec détection de séparateur et génération d'aperçu."""
        async with async_session_maker() as db:
            file = await db.get(models.File, file_id)
            if not file:
                raise ResourceNotFoundError(f"Fichier {file_id} introuvable.")

            file.status = models.FileStatus.PARSING
            await db.commit()

            try:
                path = settings.UPLOAD_DIR / str(file.dataset_id) / file.filename_stored
                
                # --- Logique de lecture du fichier (inchangée) ---
                if path.suffix == '.csv':
                    with open(path, 'r', encoding='utf-8-sig') as csvfile: # Utilise 'utf-8-sig' pour gérer le BOM
                        try:
                            dialect = csv.Sniffer().sniff(csvfile.read(2048))
                            csvfile.seek(0)
                            df = pd.read_csv(csvfile, sep=dialect.delimiter)
                        except (csv.Error, pd.errors.ParserError):
                            csvfile.seek(0)
                            df = pd.read_csv(csvfile, sep=';') # Fallback sur le point-virgule
                elif path.suffix in ['.xlsx', '.xls']:
                    df = pd.read_excel(path)
                elif path.suffix == '.json':
                    df = pd.read_json(path, lines=True) # Suppose un format JSONL
                else:
                    raise UnsupportedFormatError()

                # --- MISE À JOUR : la génération d'aperçu est extraite dans file_preview ---
                file.inferred_schema = self._infer_schema_from_dataframe(df)
                file.line_count = len(df)
                file.column_count = len(df.columns)
                file.status = models.FileStatus.READY
                logger.info(f"[ParsingTask] Fichier {file_id} parsé avec succès.")

            except AppException as ae:
                file.status = models.FileStatus.ERROR
                file.parsing_error = ae.detail
                logger.warning(f"[ParsingTask] Échec du parsing (métier) pour le fichier {file_id}: {ae.detail}")
            except Exception as e:
                file.status = models.FileStatus.ERROR
                file.parsing_error = "Une erreur inattendue est survenue lors du parsing."
                logger.error(f"[ParsingTask] Échec critique du parsing pour le fichier {file_id}: {e}")
            finally:
                await db.commit()

    def _prepare_data_for_bulk(self, df: pd.DataFrame, rules: List, index: str):
        rename_map = {r.source: r.target for r in rules}
        df_renamed = df.rename(columns=rename_map)
        for _, row in df_renamed.iterrows():
            doc = {r.target: row.get(r.target) for r in rules if r.target in df_renamed.columns}
            yield {"_index": index, "_source": doc}

    async def ingest_data(self, file_id: uuid.UUID, mapping_id: uuid.UUID):
        async with async_session_maker() as db, AsyncElasticsearch(hosts=[settings.ES_HOST]) as es_client:
            file = await db.get(models.File, file_id)
            # Import du mapping depuis le package mapping
            from app.domain.mapping.models import Mapping
            mapping = await db.get(Mapping, mapping_id)

            if not file:
                raise ResourceNotFoundError(f"Fichier avec ID {file_id} introuvable.")
            if not mapping:
                raise ResourceNotFoundError(f"Mapping avec ID {mapping_id} introuvable.")
            if not mapping.index_name:
                raise SaveError("Le nom d'index est manquant pour ce mapping.")

            file.ingestion_status = models.IngestionStatus.IN_PROGRESS
            await db.commit()

            try:
                file_path = settings.UPLOAD_DIR / str(file.dataset_id) / file.filename_stored

                if file_path.suffix == '.csv':
                    df = pd.read_csv(file_path)
                elif file_path.suffix in ['.xlsx', '.xls']:
                    df = pd.read_excel(file_path)
                elif file_path.suffix == '.json':
                    df = pd.read_json(file_path, lines=True)
                else:
                    raise UnsupportedFormatError(f"Extension {file_path.suffix} non supportée.")

                # Import du schéma MappingRule depuis le package mapping
                from app.domain.mapping.schemas import MappingRule
                rules = [MappingRule.model_validate(r) for r in mapping.mapping_rules]

                success, errors = await async_bulk(
                    es_client, self._prepare_data_for_bulk(df, rules, mapping.index_name)
                )

                file.docs_indexed = success
                if errors:
                    file.ingestion_status = models.IngestionStatus.FAILED
                    file.ingestion_errors = [str(e) for e in errors[:10]]
                else:
                    file.ingestion_status = models.IngestionStatus.COMPLETED

                logger.info(f"[IngestTask] Ingestion terminée pour fichier {file_id}. Succès: {success}, Erreurs: {len(errors)}")

            except AppException as ae:
                # Lève tel quel, car déjà formatté
                file.ingestion_status = models.IngestionStatus.FAILED
                file.ingestion_errors = [ae.detail]
                raise

            except Exception as e:
                msg = f"[IngestTask] Échec de l'ingestion pour le fichier {file_id}: {e}"
                logger.error(msg)
                file.ingestion_status = models.IngestionStatus.FAILED
                file.ingestion_errors = [str(e)]
                raise IngestionError(str(e))

            finally:
                await db.commit()
