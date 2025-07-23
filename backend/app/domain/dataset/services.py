# app/domain/dataset/services.py
import uuid
import hashlib
import aiofiles
from pathlib import Path
from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, HTTPException, status
from loguru import logger

from . import models, schemas
from backend.app.domain.user.models import User
from backend.app.core.config import settings


# --- Fonctions utilitaires ---

def _generate_stored_filename(dataset_id: uuid.UUID, version: int, original_filename: str) -> str:
    """Génère un nom de fichier unique et sécurisé pour le stockage."""
    extension = Path(original_filename).suffix
    return f"{dataset_id}_v{version}{extension}"


async def _calculate_file_hash(file: UploadFile) -> str:
    """Calcule le hash SHA256 d'un fichier uploadé de manière asynchrone."""
    hasher = hashlib.sha256()
    # Rembobine le fichier au début au cas où il aurait déjà été lu
    await file.seek(0)
    while chunk := await file.read(8192):
        hasher.update(chunk)
    await file.seek(0)  # Rembobine à nouveau pour la sauvegarde
    return hasher.hexdigest()


# --- Services pour les Datasets ---

async def create_dataset(db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User) -> models.Dataset:
    """Crée un nouveau jeu de données."""
    new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par l'utilisateur {owner.id}.")
    return new_dataset


async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
    """Récupère un dataset par son ID."""
    return await db.get(models.Dataset, dataset_id)


# --- Services pour l'Upload de Fichiers ---

async def get_next_version(db: AsyncSession, dataset_id: uuid.UUID) -> int:
    """Calcule la prochaine version pour un fichier dans un dataset."""
    max_version_result = await db.execute(
        select(func.max(models.UploadedFile.version)).where(models.UploadedFile.dataset_id == dataset_id)
    )
    max_version = max_version_result.scalar_one_or_none()
    return (max_version or 0) + 1


async def is_hash_duplicate(db: AsyncSession, dataset_id: uuid.UUID, file_hash: str) -> bool:
    """Vérifie si un fichier avec le même hash existe déjà pour ce dataset."""
    result = await db.execute(
        select(models.UploadedFile).where(
            models.UploadedFile.dataset_id == dataset_id,
            models.UploadedFile.hash == file_hash
        )
    )
    return result.scalars().first() is not None


async def upload_new_file_version(
        db: AsyncSession,
        dataset: models.Dataset,
        file: UploadFile,
        uploader: User
) -> models.UploadedFile:
    """Orchestre le processus d'upload d'un nouveau fichier."""

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
