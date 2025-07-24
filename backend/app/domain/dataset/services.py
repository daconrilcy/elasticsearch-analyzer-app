# app/domain/dataset/services.py
import uuid
import hashlib
import aiofiles
import pandas as pd
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from loguru import logger

from . import models, schemas
from backend.app.domain.user.models import User
from backend.app.core.config import settings
from backend.app.core.db import SessionLocal

from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk


# --- Fonctions utilitaires ---

def _generate_stored_filename(dataset_id: uuid.UUID, version: int, original_filename: str) -> str:
    extension = Path(original_filename).suffix
    return f"{dataset_id}_v{version}{extension}"


async def _calculate_file_hash(file: UploadFile) -> str:
    hasher = hashlib.sha256()
    await file.seek(0)
    while chunk := await file.read(8192):
        hasher.update(chunk)
    await file.seek(0)
    return hasher.hexdigest()


# --- Services pour les Datasets et Fichiers ---

async def create_dataset(db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User) -> models.Dataset:
    new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par l'utilisateur {owner.id}.")
    return new_dataset


async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
    return await db.get(models.Dataset, dataset_id)


async def get_file(db: AsyncSession, file_id: uuid.UUID) -> Optional[models.UploadedFile]:
    """Récupère un fichier uploadé par son ID."""
    return await db.get(models.UploadedFile, file_id)


async def get_next_version(db: AsyncSession, dataset_id: uuid.UUID) -> int:
    max_version_result = await db.execute(
        select(func.max(models.UploadedFile.version)).where(models.UploadedFile.dataset_id == dataset_id)
    )
    max_version = max_version_result.scalar_one_or_none()
    return (max_version or 0) + 1


async def is_hash_duplicate(db: AsyncSession, dataset_id: uuid.UUID, file_hash: str) -> bool:
    result = await db.execute(
        select(models.UploadedFile).where(
            models.UploadedFile.dataset_id == dataset_id,
            models.UploadedFile.hash == file_hash
        )
    )
    return result.scalars().first() is not None


async def upload_new_file_version(
        db: AsyncSession, dataset: models.Dataset, file: UploadFile, uploader: User
) -> models.UploadedFile:
    file_hash = await _calculate_file_hash(file)
    if await is_hash_duplicate(db, dataset.id, file_hash):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un fichier identique existe déjà pour ce jeu de données."
        )

    next_version = await get_next_version(db, dataset.id)
    stored_filename = _generate_stored_filename(dataset.id, next_version, file.filename)
    upload_path = settings.UPLOAD_DIR / str(dataset.id)
    upload_path.mkdir(parents=True, exist_ok=True)
    file_path = upload_path / stored_filename

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        logger.info(f"Fichier '{stored_filename}' sauvegardé sur le disque.")
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier : {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Impossible de sauvegarder le fichier.")

    file_size = file_path.stat().st_size
    new_file = models.UploadedFile(
        dataset_id=dataset.id,
        filename_original=file.filename,
        filename_stored=stored_filename,
        version=next_version,
        hash=file_hash,
        size_bytes=file_size,
        uploader_id=uploader.id,
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    logger.info(f"Fichier version {next_version} ajouté au dataset {dataset.id}.")
    return new_file


# --- Services pour le Parsing ---

def _infer_schema_from_dataframe(df: pd.DataFrame) -> dict:
    schema = {}
    for column, dtype in df.dtypes.items():
        if "int" in str(dtype):
            schema[column] = "integer"
        elif "float" in str(dtype):
            schema[column] = "float"
        elif "datetime" in str(dtype):
            schema[column] = "datetime"
        else:
            schema[column] = "string"
    return schema


def parse_file_and_update_db(file_id: uuid.UUID):
    db: Session = next(SessionLocal.get_db())
    uploaded_file = None
    try:
        uploaded_file = db.get(models.UploadedFile, file_id)
        if not uploaded_file:
            logger.error(f"[BackgroundTask] Fichier {file_id} non trouvé pour le parsing.")
            return
        uploaded_file.status = models.FileStatus.PARSING
        db.commit()
        file_path = settings.UPLOAD_DIR / str(uploaded_file.dataset_id) / uploaded_file.filename_stored
        df = None
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path.suffix == '.json':
            df = pd.read_json(file_path, lines=True)
        if df is not None:
            schema = _infer_schema_from_dataframe(df)
            uploaded_file.schema = schema
            uploaded_file.status = models.FileStatus.PARSED
        else:
            raise ValueError("Format de fichier non supporté pour le parsing.")
    except Exception as e:
        logger.error(f"[BackgroundTask] Échec du parsing pour le fichier {file_id}. Erreur: {e}")
        if uploaded_file: uploaded_file.status = models.FileStatus.ERROR
    finally:
        if uploaded_file: db.commit()
        db.close()


# --- Services pour les Mappings de Schéma ---

async def create_schema_mapping(
        db: AsyncSession, dataset: models.Dataset, mapping_in: schemas.SchemaMappingCreate
) -> models.SchemaMapping:
    source_file = await db.get(models.UploadedFile, mapping_in.source_file_id)
    if not source_file or source_file.dataset_id != dataset.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Le fichier source spécifié n'existe pas ou n'appartient pas à ce jeu de données."
        )
    if source_file.status != models.FileStatus.PARSED or not source_file.schema:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le fichier source doit avoir été parsé avec succès avant de créer un mapping."
        )
    source_columns_in_file = set(source_file.schema.keys())
    for rule in mapping_in.mapping_rules:
        if rule.source not in source_columns_in_file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La colonne source '{rule.source}' n'a pas été trouvée dans le schéma du fichier."
            )
    new_mapping = models.SchemaMapping(
        dataset_id=dataset.id,
        name=mapping_in.name,
        source_file_id=mapping_in.source_file_id,
        mapping_rules=[rule.model_dump() for rule in mapping_in.mapping_rules]
    )
    db.add(new_mapping)
    await db.commit()
    await db.refresh(new_mapping)
    logger.info(f"Nouveau mapping '{new_mapping.name}' créé pour le dataset {dataset.id}.")
    return new_mapping


async def get_mappings_for_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> List[models.SchemaMapping]:
    result = await db.execute(
        select(models.SchemaMapping).where(models.SchemaMapping.dataset_id == dataset_id)
    )
    return result.scalars().all()


def _generate_es_mapping_from_rules(rules: List[schemas.MappingRule]) -> Dict[str, Any]:
    """
    Génère le corps du mapping Elasticsearch à partir des règles définies.
    """
    properties = {}
    for rule in rules:
        properties[rule.target] = {"type": rule.es_type}
    return {"properties": properties}


async def create_es_index_from_mapping(
        db: AsyncSession,
        es_client: AsyncElasticsearch,
        mapping: models.SchemaMapping
) -> models.SchemaMapping:
    """
    Crée un index dans Elasticsearch en utilisant un mapping de schéma.
    """
    if mapping.index_name and await es_client.indices.exists(index=mapping.index_name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un index nommé '{mapping.index_name}' existe déjà pour ce mapping."
        )

    # Générer un nom d'index unique et prédictible
    dataset = await db.get(models.Dataset, mapping.dataset_id)
    safe_dataset_name = "".join(c if c.isalnum() else '_' for c in dataset.name.lower())
    safe_mapping_name = "".join(c if c.isalnum() else '_' for c in mapping.name.lower())
    index_name = f"{safe_dataset_name}_{safe_mapping_name}_{uuid.uuid4().hex[:6]}"

    es_mapping_body = _generate_es_mapping_from_rules(
        [schemas.MappingRule.model_validate(rule) for rule in mapping.mapping_rules]
    )

    try:
        await es_client.indices.create(index=index_name, mappings=es_mapping_body)
        logger.info(f"Index Elasticsearch '{index_name}' créé avec succès.")
    except Exception as e:
        logger.error(f"Échec de la création de l'index '{index_name}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'index Elasticsearch: {e}"
        )

    # Mettre à jour le modèle avec le nom de l'index créé
    mapping.index_name = index_name
    await db.commit()
    await db.refresh(mapping)

    return mapping


async def get_mapping(db: AsyncSession, mapping_id: uuid.UUID) -> Optional[models.SchemaMapping]:
    """Récupère un mapping de schéma par son ID."""
    return await db.get(models.SchemaMapping, mapping_id)


async def _prepare_data_for_bulk(df: pd.DataFrame, rules: List[schemas.MappingRule], index_name: str):
    """Génère des documents formatés pour l'API Bulk d'Elasticsearch."""
    rename_map = {rule.source: rule.target for rule in rules}
    df_renamed = df.rename(columns=rename_map)

    for _, row in df_renamed.iterrows():
        # Conserve uniquement les colonnes cibles définies dans le mapping
        doc = {rule.target: row.get(rule.target) for rule in rules}
        yield {
            "_index": index_name,
            "_source": doc,
        }


async def ingest_data_from_file_task(file_id: uuid.UUID, mapping_id: uuid.UUID):
    """
    Tâche asynchrone pour lire, transformer et ingérer des données dans Elasticsearch.
    """
    # On crée manuellement les dépendances nécessaires pour la tâche de fond
    db = SessionLocal()
    es_client = AsyncElasticsearch(hosts=[settings.ES_HOST])

    uploaded_file = None
    try:
        uploaded_file = await db.get(models.UploadedFile, file_id)
        mapping = await db.get(models.SchemaMapping, mapping_id)

        if not uploaded_file or not mapping or not mapping.index_name:
            logger.error(f"[IngestionTask] Fichier, mapping ou nom d'index manquant pour file_id {file_id}.")
            return

        uploaded_file.ingestion_status = models.IngestionStatus.IN_PROGRESS
        await db.commit()

        file_path = settings.UPLOAD_DIR / str(uploaded_file.dataset_id) / uploaded_file.filename_stored

        df = None
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path.suffix == '.json':
            df = pd.read_json(file_path, lines=True)

        if df is not None:
            mapping_rules = [schemas.MappingRule.model_validate(rule) for rule in mapping.mapping_rules]

            success_count, errors = await async_bulk(
                es_client,
                _prepare_data_for_bulk(df, mapping_rules, mapping.index_name)
            )

            uploaded_file.docs_indexed = success_count
            if errors:
                uploaded_file.ingestion_status = models.IngestionStatus.FAILED
                uploaded_file.ingestion_errors = [str(e) for e in errors[:10]]  # Sauvegarde les 10 premières erreurs
                logger.error(f"[IngestionTask] {len(errors)} erreurs lors de l'ingestion pour le fichier {file_id}.")
            else:
                uploaded_file.ingestion_status = models.IngestionStatus.COMPLETED
                logger.info(f"[IngestionTask] {success_count} documents ingérés avec succès pour le fichier {file_id}.")
        else:
            raise ValueError("Type de fichier non supporté pour l'ingestion.")

    except Exception as e:
        logger.error(f"[IngestionTask] Échec critique de l'ingestion pour le fichier {file_id}. Erreur: {e}")
        if uploaded_file:
            uploaded_file.ingestion_status = models.IngestionStatus.FAILED
            uploaded_file.ingestion_errors = [str(e)]
    finally:
        if uploaded_file:
            await db.commit()
        await db.close()
        await es_client.close()


# --- SERVICES POUR LA RECHERCHE ---

async def get_mapping_by_index_name(db: AsyncSession, index_name: str) -> Optional[models.SchemaMapping]:
    """Récupère un mapping de schéma par le nom de son index Elasticsearch."""
    result = await db.execute(
        select(models.SchemaMapping).where(models.SchemaMapping.index_name == index_name)
    )
    return result.scalars().first()


async def search_in_index(
        es_client: AsyncElasticsearch,
        index_name: str,
        query: str,
        page: int,
        size: int
) -> schemas.SearchResults:
    """Effectue une recherche dans un index Elasticsearch et retourne les résultats paginés."""
    if not await es_client.indices.exists(index=index_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"L'index '{index_name}' n'existe pas."
        )

    # Calcule le décalage pour la pagination
    from_offset = (page - 1) * size

    # Construit une requête de recherche simple de type "multi_match"
    # qui recherche le terme dans tous les champs.
    es_query = {
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["*"]
            }
        }
    }

    try:
        response = await es_client.search(
            index=index_name,
            body=es_query,
            from_=from_offset,
            size=size
        )

        total_hits = response['hits']['total']['value']
        hits = [schemas.SearchHit.model_validate(hit) for hit in response['hits']['hits']]

        return schemas.SearchResults(
            total=total_hits,
            hits=hits,
            page=page,
            size=size
        )

    except Exception as e:
        logger.error(f"Erreur lors de la recherche dans l'index '{index_name}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'exécution de la recherche."
        )
