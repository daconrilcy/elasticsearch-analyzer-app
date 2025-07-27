import uuid
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from elasticsearch import AsyncElasticsearch

from app.domain.dataset import models, schemas
from app.domain.project.models import Project as AnalyzerProject
from app.domain.analyzer.models import AnalyzerGraph
from app.domain.analyzer.services import convert_graph_to_es_analyzer


async def create_schema_mapping(
    db: AsyncSession, dataset: models.Dataset, mapping_in: schemas.SchemaMappingCreate
) -> models.SchemaMapping:
    source_file = await db.get(models.UploadedFile, mapping_in.source_file_id)
    if not source_file or source_file.dataset_id != dataset.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Le fichier source n'existe pas ou n'appartient pas au dataset."
        )
    if source_file.status != models.FileStatus.PARSED or not source_file.inferred_schema:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le fichier source doit être parsé avec un schéma inféré."
        )

    existing_fields = set(source_file.inferred_schema.keys())
    for rule in mapping_in.mapping_rules:
        if rule.source not in existing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Colonne source '{rule.source}' absente du schéma inféré."
            )

    mapping = models.SchemaMapping(
        dataset_id=dataset.id,
        name=mapping_in.name,
        source_file_id=mapping_in.source_file_id,
        mapping_rules=[rule.model_dump() for rule in mapping_in.mapping_rules]
    )
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)
    logger.info(f"Mapping '{mapping.name}' créé pour le dataset {dataset.id}.")
    return mapping


async def get_mapping(db: AsyncSession, mapping_id: uuid.UUID) -> Optional[models.SchemaMapping]:
    return await db.get(models.SchemaMapping, mapping_id)


async def get_mappings_for_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> List[models.SchemaMapping]:
    result = await db.execute(
        select(models.SchemaMapping).where(models.SchemaMapping.dataset_id == dataset_id)
    )
    return result.scalars().all()


async def create_es_index_from_mapping(
    db: AsyncSession, es_client: AsyncElasticsearch, mapping: models.SchemaMapping
) -> models.SchemaMapping:
    if mapping.index_name and await es_client.indices.exists(index=mapping.index_name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un index '{mapping.index_name}' existe déjà."
        )

    dataset = await db.get(models.Dataset, mapping.dataset_id)
    safe_dataset = "".join(c if c.isalnum() else '_' for c in dataset.name.lower())
    safe_mapping = "".join(c if c.isalnum() else '_' for c in mapping.name.lower())
    index_name = f"{safe_dataset}_{safe_mapping}_{uuid.uuid4().hex[:6]}"

    rules = [schemas.MappingRule.model_validate(rule) for rule in mapping.mapping_rules]
    definition = await _generate_es_index_definition(db, rules)

    try:
        await es_client.indices.create(
            index=index_name,
            settings=definition.get("settings", {}),
            mappings=definition.get("mappings", {})
        )
        logger.info(f"Index Elasticsearch '{index_name}' créé avec succès.")
    except Exception as e:
        logger.error(f"Erreur création index : {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Erreur création de l'index: {e}")

    mapping.index_name = index_name
    await db.commit()
    await db.refresh(mapping)
    return mapping


async def _generate_es_index_definition(
    db: AsyncSession, rules: List[schemas.MappingRule]
) -> Dict[str, Any]:
    properties = {}
    analyzers = {}

    for rule in rules:
        field_def = {"type": rule.es_type}
        if rule.es_type == "text" and rule.analyzer_project_id:
            analyzer_project = await db.get(AnalyzerProject, rule.analyzer_project_id)
            if not analyzer_project:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
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
