import uuid
from typing import List

from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

# Import des dépendances, modèles, schémas et services
from app.core.db import get_db
from app.core.dependencies import get_current_user, PaginationParams
from app.domain.user.models import User
from app.domain.dataset import models, schemas
from app.domain.dataset.services import DatasetService, FileService

# --- Initialisation du routeur et des services ---

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
    dependencies=[Depends(get_current_user)]  # Sécurise toutes les routes du routeur
)

dataset_service = DatasetService()
file_service = FileService()


# --- Dépendance de sécurité pour ce routeur ---

async def get_current_dataset_for_owner(
        dataset_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> models.Dataset:
    """
    Dépendance FastAPI pour récupérer un Dataset par son ID et vérifier
    que l'utilisateur authentifié en est bien le propriétaire.
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
        current_user: User = Depends(get_current_user)
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
        current_user: User = Depends(get_current_user),
        pagination: PaginationParams = Depends()  # Utilise la dépendance de pagination
):
    """Retourne une liste paginée des datasets appartenant à l'utilisateur."""
    # Note: une méthode `get_multi_by_owner` devrait être ajoutée à DatasetService
    # pour gérer la pagination.
    return await dataset_service.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=pagination.skip, limit=pagination.limit
    )


@router.get(
    "/{dataset_id}",
    response_model=schemas.DatasetDetailOut,
    summary="Obtenir les détails d'un dataset"
)
async def get_dataset_details(
        dataset: models.Dataset = Depends(get_current_dataset_for_owner)
):
    """
    Retourne les informations détaillées d'un dataset, y compris la liste
    de ses fichiers et mappings.
    """
    # Note: DatasetDetailOut nécessite que les relations `files` et `mappings`
    # soient chargées. SQLAlchemy les chargera paresseusement (lazy loading).
    return dataset


@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un dataset"
)
async def delete_dataset(
        dataset: models.Dataset = Depends(get_current_dataset_for_owner),
        db: AsyncSession = Depends(get_db)
):
    """
    Supprime un dataset et toutes ses ressources associées (fichiers, mappings)
    en cascade.
    """
    await dataset_service.remove(db=db, dataset_id=dataset.id)
    return


# --- Endpoints pour la gestion des Fichiers au sein d'un Dataset ---

@router.post(
    "/{dataset_id}/files",
    response_model=schemas.FileOut,
    status_code=status.HTTP_201_CREATED,
    summary="Uploader un nouveau fichier dans un dataset"
)
async def upload_file_to_dataset(
        dataset: models.Dataset = Depends(get_current_dataset_for_owner),
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Uploade un nouveau fichier. Le service gère la validation, le stockage,
    le versioning et la création de l'enregistrement en base de données.
    Une tâche de parsing est ensuite lancée en arrière-plan.
    """
    return await file_service.upload(db=db, dataset=dataset, file=file, uploader=current_user)


@router.get(
    "/{dataset_id}/files",
    response_model=List[schemas.FileOut],
    summary="Lister les fichiers d'un dataset"
)
async def list_files_in_dataset(
        dataset: models.Dataset = Depends(get_current_dataset_for_owner),
        pagination: PaginationParams = Depends()
):
    """Retourne la liste paginée des fichiers appartenant à un dataset spécifique."""
    # Note: La pagination sur une relation chargée paresseusement peut être inefficace.
    # Une méthode de service dédiée `file_service.get_multi_by_dataset` serait préférable.
    start = pagination.skip
    end = pagination.skip + pagination.limit
    return dataset.files[start:end]
