# app/api/v1/datasets.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pathlib import Path

from backend.app.core.db import get_db
from backend.app.domain.dataset import services, schemas
from backend.app.domain.user.models import User
from backend.app.api.dependencies import get_current_user

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
