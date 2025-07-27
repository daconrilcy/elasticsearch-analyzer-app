# app/api/v1/datasets.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from loguru import logger
from elasticsearch import AsyncElasticsearch

from app.core.db import get_db
from app.core.es_client import get_es_client
from app.domain.dataset import services
from app.domain.dataset import schemas, models
from app.domain.user.models import User
from app.api.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.DatasetOut, status_code=status.HTTP_201_CREATED)
async def create_dataset_endpoint(
        dataset_in: schemas.DatasetCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return await services.create_dataset(db=db, dataset_in=dataset_in, owner=current_user)


@router.get("/{dataset_id}", response_model=schemas.DatasetDetailOut)
async def get_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return await services.get_dataset_owned_by_user(db, dataset_id, current_user)


@router.post("/{dataset_id}/upload-file/", response_model=schemas.FileUploadResponse)
async def upload_file_endpoint(
        dataset_id: uuid.UUID,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    dataset = await services.get_dataset_owned_by_user(db, dataset_id, current_user)
    services.validate_uploaded_file(file)
    uploaded_file, inferred_schema = await services.upload_new_file_version(db, dataset, file, current_user)
    schema_list = [schemas.FileStructureField(field=s["field"], type=s["type"]) for s in (inferred_schema or [])]
    logger.debug(f"File uploaded: {uploaded_file.id}")
    return schemas.FileUploadResponse(file_id=str(uploaded_file.id), schema=schema_list)


@router.get("/{dataset_id}/files/", response_model=List[schemas.UploadedFileOut])
async def list_files_for_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    dataset = await services.get_dataset_owned_by_user(db, dataset_id, current_user)
    return dataset.files


@router.post("/{file_id}/parse", status_code=status.HTTP_202_ACCEPTED)
async def parse_file_endpoint(
        file_id: uuid.UUID,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    file = await services.get_file_owned_by_user(db, file_id, current_user)
    if file.status not in [models.FileStatus.PENDING, models.FileStatus.ERROR]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier est déjà en cours ou traité.")
    background_tasks.add_task(services.parse_file_and_update_db, file.id)
    return {"message": "Le traitement a été lancé."}


@router.post("/{dataset_id}/mappings/", response_model=schemas.SchemaMappingOut, status_code=status.HTTP_201_CREATED)
async def create_schema_mapping_endpoint(
        dataset_id: uuid.UUID,
        mapping_in: schemas.SchemaMappingCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    dataset = await services.get_dataset_owned_by_user(db, dataset_id, current_user)
    return await services.create_schema_mapping(db, dataset, mapping_in)


@router.get("/{dataset_id}/mappings/", response_model=List[schemas.SchemaMappingOut])
async def get_mappings_for_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    await services.get_dataset_owned_by_user(db, dataset_id, current_user)
    return await services.get_mappings_for_dataset(db, dataset_id)


@router.post("/mappings/{mapping_id}/create-index", response_model=schemas.SchemaMappingOut)
async def create_index_from_mapping_endpoint(
        mapping_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        es_client: AsyncElasticsearch = Depends(get_es_client),
        current_user: User = Depends(get_current_user)
):
    mapping = await services.get_mapping(db, mapping_id)
    if not mapping or mapping.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce mapping.")
    return await services.create_es_index_from_mapping(db, es_client, mapping)


@router.post("/files/{file_id}/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_file_data_endpoint(
        file_id: uuid.UUID,
        ingest_request: schemas.IngestRequest,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    file = await services.get_file_owned_by_user(db, file_id, current_user)
    mapping = await services.get_mapping(db, ingest_request.mapping_id)
    if not mapping or mapping.dataset_id != file.dataset_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mapping invalide ou non lié au dataset.")
    if not mapping.index_name:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="L'index Elasticsearch est manquant.")
    if file.status != models.FileStatus.PARSED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier doit être parsé avant ingestion.")
    background_tasks.add_task(services.ingest_data_from_file_task, file.id, ingest_request.mapping_id)
    return {"message": "Ingestion en arrière-plan démarrée."}


@router.post("/search/{index_name}", response_model=schemas.SearchResults)
async def search_index_endpoint(
        index_name: str,
        search_query: schemas.SearchQuery,
        db: AsyncSession = Depends(get_db),
        es_client: AsyncElasticsearch = Depends(get_es_client),
        current_user: User = Depends(get_current_user)
):
    mapping = await services.get_mapping_by_index_name(db, index_name)
    if not mapping or mapping.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à cet index.")
    return await services.search_in_index(es_client, index_name, search_query.query, search_query.page,
                                          search_query.size)
