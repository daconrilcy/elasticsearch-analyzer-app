"""app/domain/dataset/services/ingestion_service.py"""

import uuid
import pandas as pd
from typing import List
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk
from loguru import logger

from app.core.config import settings
from app.domain.dataset import models, schemas
from app.core.db import async_session_maker


async def ingest_data_from_file_task(file_id: uuid.UUID, mapping_id: uuid.UUID):
    """Ingestion des données d'un fichier."""
    async with async_session_maker() as db, AsyncElasticsearch(hosts=[settings.ES_HOST]) as es_client:
        uploaded_file = None
        try:
            uploaded_file = await db.get(models.UploadedFile, file_id)
            mapping = await db.get(models.SchemaMapping, mapping_id)
            if not uploaded_file or not mapping or not mapping.index_name:
                logger.error(f"[Ingest] Données manquantes pour fichier {file_id}.")
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
                rules = [schemas.MappingRule.model_validate(r) for r in mapping.mapping_rules]
                success, errors = await async_bulk(
                    es_client, _prepare_data_for_bulk(df, rules, mapping.index_name)
                )
                uploaded_file.docs_indexed = success
                if errors:
                    uploaded_file.ingestion_status = models.IngestionStatus.FAILED
                    uploaded_file.ingestion_errors = [str(e) for e in errors[:10]]
                else:
                    uploaded_file.ingestion_status = models.IngestionStatus.COMPLETED
            else:
                raise ValueError("Format non supporté.")
        except Exception as e:
            logger.error(f"[Ingest] Échec ingestion fichier {file_id}: {e}")
            if uploaded_file:
                uploaded_file.ingestion_status = models.IngestionStatus.FAILED
                uploaded_file.ingestion_errors = [str(e)]
        finally:
            if uploaded_file:
                await db.commit()


def _prepare_data_for_bulk(df: pd.DataFrame, rules: List[schemas.MappingRule], index: str):
    rename_map = {r.source: r.target for r in rules}
    df = df.rename(columns=rename_map)
    for _, row in df.iterrows():
        doc = {r.target: row.get(r.target) for r in rules}
        yield {"_index": index, "_source": doc}
