"""app/domain/dataset/services/search_service.py"""
from typing import Optional
from elasticsearch import AsyncElasticsearch
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.domain.dataset import models, schemas


async def get_mapping_by_index_name(db: AsyncSession, index_name: str) -> Optional[models.SchemaMapping]:
    """Récupère un mapping par son index."""
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
    """Recherche dans un index."""
    if not await es_client.indices.exists(index=index_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Index '{index_name}' inexistant.")

    from_offset = (page - 1) * size
    es_query = {"query": {"multi_match": {"query": query, "fields": ["*"]}}}

    try:
        response = await es_client.search(index=index_name, body=es_query, from_=from_offset, size=size)
        total_hits = response['hits']['total']['value']
        hits = [schemas.SearchHit.model_validate(hit) for hit in response['hits']['hits']]
        return schemas.SearchResults(total=total_hits, hits=hits, page=page, size=size)
    except Exception as e:
        logger.error(f"[Search] Erreur recherche '{index_name}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur de recherche.")
