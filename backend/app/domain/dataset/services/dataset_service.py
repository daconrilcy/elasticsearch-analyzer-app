import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.domain.dataset import models, schemas
from app.domain.user.models import User
from loguru import logger


async def create_dataset(db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User) -> models.Dataset:
    """Crée un nouveau jeu de données."""
    new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
    await db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par l'utilisateur {owner.id}.")
    return new_dataset


async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
    """Récupère un dataset par son ID."""
    return await db.get(models.Dataset, dataset_id)


async def get_dataset_owned_by_user(db: AsyncSession, dataset_id: uuid.UUID, user: User) -> models.Dataset:
    """Vérifie que l'utilisateur possède le dataset et le retourne."""
    dataset = await get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jeu de données non trouvé.")
    if dataset.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce jeu de données.")
    return dataset
