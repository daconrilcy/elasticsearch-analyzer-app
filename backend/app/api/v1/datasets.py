import uuid
from typing import List

from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

# Import des dépendances, modèles, schémas et services
from app.core.db import get_db
# --- CORRECTION : Utiliser la dépendance du cookie ---
from app.api.dependencies import get_current_user_from_cookie, PaginationParams
from app.domain.user.models import User
from app.domain.dataset import models, schemas
from app.domain.file import schemas as file_schemas
from app.domain.dataset.services import DatasetService
from app.domain.file.services import FileService, TaskService
from loguru import logger

# --- Initialisation du routeur ---
router = APIRouter(
    tags=["Datasets"],
    # --- CORRECTION : Applique la dépendance du cookie à toutes les routes ---
    dependencies=[Depends(get_current_user_from_cookie)]
)

dataset_service = DatasetService()

# --- Dépendance de sécurité unifiée pour ce routeur ---
async def get_current_dataset_for_owner(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # --- CORRECTION : Utilise la dépendance du cookie ---
    current_user: User = Depends(get_current_user_from_cookie)
) -> models.Dataset:
    """
    Dépendance FastAPI pour récupérer un Dataset par son ID et vérifier
    que l'utilisateur authentifié (via cookie) en est bien le propriétaire.
    """
    return await dataset_service.get_owned_by_user(db=db, dataset_id=dataset_id, user=current_user)

# --- Endpoints pour la gestion des Datasets ---

@router.post(
    "/",
    response_model=schemas.DatasetOut,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un nouveau dataset"
)
async def create_dataset(
    dataset_in: schemas.DatasetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie)
):
    """Crée un nouveau conteneur logique (dataset) pour des fichiers."""
    return await dataset_service.create(db=db, dataset_in=dataset_in, owner=current_user)

@router.get(
    "/",
    response_model=List[schemas.DatasetOut],
    summary="Lister les datasets de l'utilisateur"
)
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
    pagination: PaginationParams = Depends()
):
    """Retourne une liste paginée des datasets appartenant à l'utilisateur."""
    return await dataset_service.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=pagination.skip, limit=pagination.limit
    )

@router.get(
    "/{dataset_id}",
    response_model=schemas.DatasetDetailOut,
    summary="Obtenir les détails d'un dataset"
)
async def get_dataset_details(
    dataset: models.Dataset = Depends(get_current_dataset_for_owner),
    db: AsyncSession = Depends(get_db)
):
    """Retourne les informations détaillées d'un dataset."""
    # Charger explicitement les relations des fichiers avec leurs uploaders
    await db.refresh(dataset, attribute_names=['files'])
    
    # Construire manuellement les données des fichiers avec le nom d'utilisateur
    files_data = []
    for file in dataset.files:
        # Récupérer le nom d'utilisateur depuis la relation uploader si elle est chargée
        uploader_name = None
        if hasattr(file, 'uploader') and file.uploader:
            uploader_name = file.uploader.username
        
        # Si la relation n'est pas chargée, faire une requête séparée
        if not uploader_name:
            from sqlalchemy import select
            from app.domain.user.models import User
            
            result = await db.execute(
                select(User.username).where(User.id == file.uploader_id)
            )
            uploader_name = result.scalar_one_or_none()
        
        file_data = {
            "id": file.id,
            "filename_original": file.filename_original,
            "filename_stored": file.filename_stored,
            "status": file.status,
            "parsing_error": file.parsing_error,
            "version": file.version,
            "size_bytes": file.size_bytes,
            "file_size": file.size_bytes,  # Alias pour compatibilité
            "hash": file.hash,
            "line_count": file.line_count,
            "column_count": file.column_count,
            "uploader_id": file.uploader_id,
            "uploader_name": uploader_name,
            "created_at": file.created_at,
            "updated_at": file.updated_at,
            "ingestion_status": file.ingestion_status,
            "docs_indexed": file.docs_indexed,
            "ingestion_errors": file.ingestion_errors,
            "mapping_id": None,  # Le modèle File n'a pas cet attribut
            "inferred_schema": file.inferred_schema,
            "preview_data": file.preview_data,
            "mime_type": file.mime_type
        }
        files_data.append(file_data)
    
    # Créer un dictionnaire avec les données du dataset et les fichiers modifiés
    dataset_data = {
        "id": dataset.id,
        "name": dataset.name,
        "description": dataset.description,
        "owner_id": dataset.owner_id,
        "created_at": dataset.created_at,
        "updated_at": dataset.updated_at,
        "files": files_data,
        "mappings": dataset.mappings
    }
    
    return dataset_data

@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un dataset"
)
async def delete_dataset(
    dataset: models.Dataset = Depends(get_current_dataset_for_owner),
    db: AsyncSession = Depends(get_db)
):
    """Supprime un dataset et toutes ses ressources associées."""
    await dataset_service.remove(db=db, dataset_id=dataset.id)
    return

# --- Endpoints pour la gestion des Fichiers au sein d'un Dataset ---

@router.post(
    "/{dataset_id}/files",
    response_model=file_schemas.FileOut,
    status_code=status.HTTP_201_CREATED,
    summary="Uploader un nouveau fichier dans un dataset"
)
async def upload_file_to_dataset(
    dataset: models.Dataset = Depends(get_current_dataset_for_owner),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
):
    """Uploade un nouveau fichier et lance une tâche de parsing en arrière-plan."""
    try:
        file_service = FileService()
        new_file = await file_service.upload(db=db, dataset=dataset, file=file, uploader=current_user)

        task_service = TaskService()
        background_tasks.add_task(task_service.parse_file, file_id=new_file.id)
        logger.debug(f"New File: {new_file}")
        return new_file
    except Exception as e:
        logger.error(f"EXCEPTION inattendue : {type(e)} - {str(e)}")
        raise


@router.get(
    "/{dataset_id}/files",
    response_model=List[file_schemas.FileOut],
    summary="Lister les fichiers d'un dataset"
)
async def list_files_in_dataset(
    dataset: models.Dataset = Depends(get_current_dataset_for_owner),
    pagination: PaginationParams = Depends()
):
    """Retourne la liste paginée des fichiers appartenant à un dataset."""
    start = pagination.skip
    end = pagination.skip + pagination.limit
    logger.debug(dataset.files[start:end])
    return dataset.files[start:end]