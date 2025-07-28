import uuid
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any

import aiofiles
import pandas as pd
from loguru import logger
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk

from app.core.config import settings
from app.core.db import async_session_maker
from app.domain.dataset import models, schemas
from app.domain.user.models import User
# Supposons que ces services/modèles externes existent et sont importés correctement
from app.domain.project.models import Project as AnalyzerProject
from app.domain.analyzer.models import AnalyzerGraph
from app.domain.analyzer.services import convert_graph_to_es_analyzer

# --- Constantes de validation ---
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


# --- Classes de Service ---

class DatasetService:
    """Service pour les opérations CRUD sur l'entité Dataset."""

    async def get(self, db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
        """Récupère un dataset par son ID."""
        return await db.get(models.Dataset, dataset_id)

    async def get_owned_by_user(self, db: AsyncSession, dataset_id: uuid.UUID, user: User) -> models.Dataset:
        """Récupère un dataset et vérifie que l'utilisateur en est le propriétaire."""
        dataset = await self.get(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données non trouvé.")
        if dataset.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce jeu de données.")
        return dataset

    async def create(self, db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User) -> models.Dataset:
        """Crée un nouveau jeu de données."""
        new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
        db.add(new_dataset)
        await db.commit()
        await db.refresh(new_dataset)
        logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par {owner.id}.")
        return new_dataset

    async def get_multi_by_owner(self, db: AsyncSession, owner_id: uuid.UUID, skip: int, limit: int) -> List[
        models.Dataset]:
        """Récupère une liste paginée de datasets pour un propriétaire."""
        result = await db.execute(
            select(models.Dataset).where(models.Dataset.owner_id == owner_id).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def remove(self, db: AsyncSession, dataset_id: uuid.UUID):
        """Supprime un dataset. La cascade gère la suppression des entités liées."""
        dataset = await db.get(models.Dataset, dataset_id)
        if dataset:
            await db.delete(dataset)
            await db.commit()
            logger.info(f"Dataset ID {dataset_id} et ses données associées ont été supprimés.")


class FileService:
    """Service pour tout le cycle de vie d'un Fichier."""

    def _validate_file(self, file: UploadFile):
        """Valide l'extension du fichier."""
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Format de fichier non autorisé. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}"
            )

    async def get_owned_by_user(self, db: AsyncSession, file_id: uuid.UUID, user: User) -> models.File:
        """Récupère un fichier et vérifie la propriété via le dataset parent."""
        file = await db.get(models.File, file_id)
        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé.")
        if file.dataset.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce fichier.")
        return file

    async def upload(self, db: AsyncSession, dataset: models.Dataset, file: UploadFile, uploader: User) -> models.File:
        """Gère l'upload, la validation, le hachage, le versioning et le stockage d'un fichier."""
        self._validate_file(file)

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail="Le fichier est trop volumineux.")

        file_hash = hashlib.sha256(content).hexdigest()

        result = await db.execute(
            select(models.File).where(models.File.dataset_id == dataset.id, models.File.hash == file_hash)
        )
        if result.scalars().first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Un fichier identique existe déjà.")

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
            logger.error(f"Erreur de sauvegarde du fichier : {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la sauvegarde du fichier.")

        new_file = models.File(
            dataset_id=dataset.id, filename_original=file.filename, filename_stored=stored_name,
            version=version, hash=file_hash, size_bytes=len(content), uploader_id=uploader.id,
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
            storage_path = settings.UPLOAD_DIR / str(file_to_delete.dataset_id) / file_to_delete.filename_stored
            if storage_path.exists():
                storage_path.unlink()

            await db.delete(file_to_delete)
            await db.commit()
            logger.info(f"Fichier ID {file_id} supprimé.")


class MappingService:
    """Service pour les opérations CRUD sur les Mappings."""

    async def create(
            self, db: AsyncSession, dataset: models.Dataset, mapping_in: schemas.MappingCreate
    ) -> models.Mapping:
        """Crée un nouveau mapping de schéma."""
        source_file = await db.get(models.File, mapping_in.source_file_id)
        if not source_file or source_file.dataset_id != dataset.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Le fichier source n'existe pas ou n'appartient pas au dataset."
            )
        if source_file.status != models.FileStatus.READY:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Le fichier source n'est pas prêt (statut: {source_file.status.value}). Il doit être parsé avec succès."
            )

        # Valider que les champs sources du mapping existent dans le schéma inféré du fichier
        existing_fields = set(source_file.inferred_schema.keys())
        for rule in mapping_in.mapping_rules:
            if rule.source not in existing_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La colonne source '{rule.source}' est absente du schéma du fichier."
                )

        mapping = models.Mapping(
            dataset_id=dataset.id,
            name=mapping_in.name,
            source_file_id=mapping_in.source_file_id,
            mapping_rules=[rule.model_dump() for rule in mapping_in.mapping_rules]
        )
        db.add(mapping)
        await db.commit()
        await db.refresh(mapping)
        logger.info(f"Mapping '{mapping.name}' (ID: {mapping.id}) créé pour le dataset {dataset.id}.")
        return mapping

    async def get_multi_by_dataset(self, db: AsyncSession, dataset_id: uuid.UUID) -> List[models.Mapping]:
        """Récupère tous les mappings pour un dataset donné."""
        result = await db.execute(
            select(models.Mapping).where(models.Mapping.dataset_id == dataset_id)
        )
        return result.scalars().all()


class ElasticsearchService:
    """Service pour toutes les interactions avec Elasticsearch."""

    def __init__(self, es_client: AsyncElasticsearch):
        self.es = es_client

    async def _generate_es_index_definition(self, db: AsyncSession, rules: List[schemas.MappingRule]) -> Dict[str, Any]:
        """Génère la définition de l'index ES (settings et mappings)."""
        properties = {}
        analyzers = {}

        for rule in rules:
            field_def = {"type": rule.es_type}
            if rule.es_type == "text" and rule.analyzer_project_id:
                analyzer_project = await db.get(AnalyzerProject, rule.analyzer_project_id)
                if not analyzer_project:
                    raise HTTPException(status_code=400,
                                        detail=f"Projet d'analyseur ID {rule.analyzer_project_id} introuvable.")

                name = f"custom_{analyzer_project.name.lower().replace(' ', '_')}"
                graph = AnalyzerGraph.model_validate(analyzer_project.graph)
                analyzers[name] = convert_graph_to_es_analyzer(graph)
                field_def["analyzer"] = name
            properties[rule.target] = field_def

        definition = {"mappings": {"properties": properties}}
        if analyzers:
            definition["settings"] = {"analysis": {"analyzer": analyzers}}
        return definition

    async def create_index_from_mapping(self, db: AsyncSession, mapping: models.Mapping) -> models.Mapping:
        """Crée un index Elasticsearch à partir d'un mapping."""
        if mapping.index_name and await self.es.indices.exists(index=mapping.index_name):
            raise HTTPException(status_code=409, detail=f"Un index '{mapping.index_name}' existe déjà.")

        dataset = await db.get(models.Dataset, mapping.dataset_id)
        safe_dataset_name = "".join(c if c.isalnum() else '_' for c in dataset.name.lower())
        safe_mapping_name = "".join(c if c.isalnum() else '_' for c in mapping.name.lower())
        index_name = f"{safe_dataset_name}_{safe_mapping_name}_{uuid.uuid4().hex[:6]}"

        rules = [schemas.MappingRule.model_validate(rule) for rule in mapping.mapping_rules]
        definition = await self._generate_es_index_definition(db, rules)

        try:
            await self.es.indices.create(
                index=index_name,
                settings=definition.get("settings", {}),
                mappings=definition.get("mappings", {})
            )
            logger.info(f"Index Elasticsearch '{index_name}' créé avec succès.")
        except Exception as e:
            logger.error(f"Erreur lors de la création de l'index ES : {e}")
            raise HTTPException(status_code=500, detail=f"Erreur création de l'index: {e}")

        mapping.index_name = index_name
        await db.commit()
        await db.refresh(mapping)
        return mapping

    async def search(self, index_name: str, query: str, page: int, size: int) -> schemas.SearchResults:
        """Effectue une recherche dans un index."""
        if not await self.es.indices.exists(index=index_name):
            raise HTTPException(status_code=404, detail=f"Index '{index_name}' inexistant.")

        from_offset = (page - 1) * size
        es_query = {"query": {"multi_match": {"query": query, "fields": ["*"]}}}

        try:
            response = await self.es.search(index=index_name, body=es_query, from_=from_offset, size=size)
            total_hits = response['hits']['total']['value']
            hits = [schemas.SearchHit.model_validate(hit) for hit in response['hits']['hits']]
            return schemas.SearchResults(total=total_hits, hits=hits, page=page, size=size)
        except Exception as e:
            logger.error(f"Erreur de recherche dans l'index '{index_name}': {e}")
            raise HTTPException(status_code=500, detail="Erreur de recherche.")


class TaskService:
    """Contient la logique métier destinée à être exécutée par des workers de tâches de fond."""

    async def _infer_schema_from_dataframe(self, df: pd.DataFrame) -> Dict[str, str]:
        """Inférence de schéma à partir d'un DataFrame pandas."""
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

    async def parse_file(self, file_id: uuid.UUID):
        """Tâche de parsing d'un fichier."""
        async with async_session_maker() as db:
            file = await db.get(models.File, file_id)
            if not file:
                logger.error(f"[ParsingTask] Fichier {file_id} introuvable.")
                return

            file.status = models.FileStatus.PARSING
            await db.commit()

            try:
                path = settings.UPLOAD_DIR / str(file.dataset_id) / file.filename_stored
                if path.suffix == '.csv':
                    df = pd.read_csv(path)
                elif path.suffix in ['.xlsx', '.xls']:
                    df = pd.read_excel(path)
                elif path.suffix == '.json':
                    df = pd.read_json(path, lines=True)
                else:
                    raise ValueError(f"Format de fichier non supporté pour le parsing: {path.suffix}")

                file.inferred_schema = self._infer_schema_from_dataframe(df)
                file.status = models.FileStatus.READY
                logger.info(f"[ParsingTask] Fichier {file_id} parsé avec succès.")
            except Exception as e:
                logger.error(f"[ParsingTask] Échec du parsing pour le fichier {file_id}: {e}")
                file.status = models.FileStatus.ERROR
            finally:
                await db.commit()

    def _prepare_data_for_bulk(self, df: pd.DataFrame, rules: List[schemas.MappingRule], index: str):
        """Prépare les données du DataFrame pour l'ingestion en vrac (bulk)."""
        rename_map = {r.source: r.target for r in rules}
        df_renamed = df.rename(columns=rename_map)
        for _, row in df_renamed.iterrows():
            doc = {r.target: row.get(r.target) for r in rules if r.target in df_renamed.columns}
            yield {"_index": index, "_source": doc}

    async def ingest_data(self, file_id: uuid.UUID, mapping_id: uuid.UUID):
        """Tâche d'ingestion des données d'un fichier dans Elasticsearch."""
        async with async_session_maker() as db, AsyncElasticsearch(hosts=[settings.ES_HOST]) as es_client:
            file = await db.get(models.File, file_id)
            mapping = await db.get(models.Mapping, mapping_id)
            if not file or not mapping or not mapping.index_name:
                logger.error(f"[IngestTask] Données manquantes pour fichier {file_id} ou mapping {mapping_id}.")
                return

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
                    raise ValueError(f"Format de fichier non supporté pour l'ingestion: {file_path.suffix}")

                rules = [schemas.MappingRule.model_validate(r) for r in mapping.mapping_rules]
                success, errors = await async_bulk(
                    es_client, self._prepare_data_for_bulk(df, rules, mapping.index_name)
                )

                file.docs_indexed = success
                if errors:
                    file.ingestion_status = models.IngestionStatus.FAILED
                    file.ingestion_errors = [str(e) for e in errors[:10]]  # Limiter le nombre d'erreurs stockées
                else:
                    file.ingestion_status = models.IngestionStatus.COMPLETED
                logger.info(
                    f"[IngestTask] Ingestion terminée pour fichier {file_id}. Succès: {success}, Erreurs: {len(errors)}")
            except Exception as e:
                logger.error(f"[IngestTask] Échec de l'ingestion pour le fichier {file_id}: {e}")
                file.ingestion_status = models.IngestionStatus.FAILED
                file.ingestion_errors = [str(e)]
            finally:
                await db.commit()
