# app/api/v1/datasets.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pathlib import Path

from backend.app.core.db import get_db
from backend.app.domain.dataset import services, schemas, models
from backend.app.domain.user.models import User
from backend.app.api.dependencies import get_current_user
from fastapi import BackgroundTasks

from backend.app.core.es_client import get_es_client
from elasticsearch import AsyncElasticsearch

router = APIRouter()


# --- Endpoints pour les Datasets ---

@router.post("/", response_model=schemas.DatasetOut, status_code=status.HTTP_201_CREATED)
async def create_dataset_endpoint(
        dataset_in: schemas.DatasetCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Crée un nouveau jeu de données pour l'utilisateur authentifié."""
    return await services.create_dataset(db=db, dataset_in=dataset_in, owner=current_user)


@router.get("/{dataset_id}", response_model=schemas.DatasetDetailOut)
async def get_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Récupère les détails d'un jeu de données et la liste de ses fichiers."""
    dataset = await services.get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données non trouvé.")

    # CORRECTION : On utilise maintenant 'current_user' pour vérifier la propriété.
    if dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce jeu de données.")

    return dataset


# --- Endpoints pour l'Upload de Fichiers ---

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/{dataset_id}/upload-file/", response_model=schemas.UploadedFileOut)
async def upload_file_endpoint(
        dataset_id: uuid.UUID,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Uploade un nouveau fichier pour un jeu de données, créant une nouvelle version."""
    dataset = await services.get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données non trouvé.")

    # CORRECTION : On vérifie aussi la propriété avant d'autoriser l'upload.
    if dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Vous ne pouvez pas ajouter de fichier à un jeu de données qui ne vous appartient pas.")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Format de fichier non autorisé. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}")

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Le fichier est trop volumineux.")

    return await services.upload_new_file_version(db=db, dataset=dataset, file=file, uploader=current_user)


@router.get("/{dataset_id}/files/", response_model=List[schemas.UploadedFileOut])
async def list_files_for_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Liste tous les fichiers (versions) pour un jeu de données."""
    dataset = await services.get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données non trouvé.")

    # CORRECTION : On vérifie également la propriété ici.
    if dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce jeu de données.")

    return dataset.files


@router.post("/{file_id}/parse", status_code=status.HTTP_202_ACCEPTED)
async def parse_file_endpoint(
        file_id: uuid.UUID,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Déclenche une tâche de parsing en arrière-plan pour un fichier uploadé.
    """
    # Utilisons un service pour récupérer le fichier pour garder la logique métier séparée
    # (Créons-le dans le service)
    uploaded_file = await services.get_file(db, file_id)
    if not uploaded_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé.")

    # Vérifie que l'utilisateur est bien le propriétaire du dataset associé
    if uploaded_file.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce fichier.")

    if uploaded_file.status not in [models.FileStatus.PENDING, models.FileStatus.ERROR]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Le fichier est déjà parsé ou en cours de traitement (statut: {uploaded_file.status})."
        )

    background_tasks.add_task(services.parse_file_and_update_db, uploaded_file.id)

    return {"message": "Le traitement du fichier a été démarré en arrière-plan."}


@router.post("/{dataset_id}/mappings/", response_model=schemas.SchemaMappingOut, status_code=status.HTTP_201_CREATED)
async def create_schema_mapping_endpoint(
        dataset_id: uuid.UUID,
        mapping_in: schemas.SchemaMappingCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Crée un nouveau mapping de schéma pour un jeu de données."""
    dataset = await services.get_dataset(db=db, dataset_id=dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Jeu de données non trouvé ou accès non autorisé.")

    return await services.create_schema_mapping(db=db, dataset=dataset, mapping_in=mapping_in)


@router.get("/{dataset_id}/mappings/", response_model=List[schemas.SchemaMappingOut])
async def get_mappings_for_dataset_endpoint(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Liste tous les mappings pour un jeu de données."""
    dataset = await services.get_dataset(db=db, dataset_id=dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Jeu de données non trouvé ou accès non autorisé.")

    return await services.get_mappings_for_dataset(db=db, dataset_id=dataset_id)


@router.post(
    "/mappings/{mapping_id}/create-index",
    response_model=schemas.SchemaMappingOut,
    status_code=status.HTTP_201_CREATED
)
async def create_index_from_mapping_endpoint(
        mapping_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        es_client: AsyncElasticsearch = Depends(get_es_client),
        current_user: User = Depends(get_current_user)
):
    """
    Crée un index Elasticsearch à partir d'un mapping de schéma.
    """
    mapping = await services.get_mapping(db, mapping_id)
    if not mapping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping non trouvé.")

    # Vérifie que l'utilisateur est bien le propriétaire du dataset associé
    if mapping.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce mapping.")

    updated_mapping = await services.create_es_index_from_mapping(db, es_client, mapping)
    return updated_mapping


@router.post("/files/{file_id}/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_file_data_endpoint(
        file_id: uuid.UUID,
        ingest_request: schemas.IngestRequest,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Déclenche l'ingestion des données d'un fichier dans Elasticsearch
    en utilisant un mapping de schéma spécifié.
    """
    uploaded_file = await services.get_file(db, file_id)
    if not uploaded_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé.")

    if uploaded_file.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce fichier.")

    mapping = await services.get_mapping(db, ingest_request.mapping_id)
    if not mapping or mapping.dataset_id != uploaded_file.dataset_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Le mapping spécifié est invalide ou n'appartient pas à ce jeu de données.")

    if not mapping.index_name:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Un index Elasticsearch doit d'abord être créé pour ce mapping.")

    if uploaded_file.status != models.FileStatus.PARSED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Le fichier doit être au statut 'parsed' pour pouvoir être ingéré.")

    background_tasks.add_task(services.ingest_data_from_file_task, file_id, ingest_request.mapping_id)

    return {"message": "L'ingestion des données a été démarrée en arrière-plan."}


# --- ENDPOINT POUR LA RECHERCHE ---

@router.post("/search/{index_name}", response_model=schemas.SearchResults)
async def search_index_endpoint(
        index_name: str,
        search_query: schemas.SearchQuery,
        db: AsyncSession = Depends(get_db),
        es_client: AsyncElasticsearch = Depends(get_es_client),
        current_user: User = Depends(get_current_user)
):
    """
    Effectue une recherche paginée dans un index Elasticsearch spécifié.
    """
    # 1. Vérifier que le mapping (et donc l'index) existe dans notre système
    mapping = await services.get_mapping_by_index_name(db, index_name)
    if not mapping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Index non trouvé ou non géré par cette application.")

    # 2. Vérifier que l'utilisateur a le droit d'accéder à cet index
    # en vérifiant qu'il est le propriétaire du dataset parent.
    if mapping.dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à cet index.")

    # 3. Exécuter la recherche
    return await services.search_in_index(
        es_client=es_client,
        index_name=index_name,
        query=search_query.query,
        page=search_query.page,
        size=search_query.size
    )
