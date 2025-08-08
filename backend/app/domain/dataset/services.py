import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from loguru import logger

from app.domain.dataset import models, schemas
from app.domain.user.models import User
from app.core.exceptions import (
    ResourceNotFoundError,
    ForbiddenError
)


# --- Service Dataset ---
class DatasetService:
    """Service pour les opérations CRUD sur l'entité Dataset."""

    async def get(self, db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
        """Récupère un dataset par son ID."""
        return await db.get(models.Dataset, dataset_id)

    async def get_owned_by_user(
        self, db: AsyncSession, dataset_id: uuid.UUID, user: User
    ) -> models.Dataset:
        """
        Récupère un dataset, vérifie la propriété et charge toutes les relations
        nécessaires pour l'affichage détaillé, y compris l'uploader de chaque fichier.
        """
        from app.domain.file.models import File
        from app.domain.mapping.models import Mapping
        
        query = (
            select(models.Dataset)
            .where(models.Dataset.id == dataset_id, models.Dataset.owner_id == user.id)
            .options(
                # Charge la relation 'files' et, pour chaque fichier, charge son 'uploader'
                selectinload(models.Dataset.files).options(
                    joinedload(File.uploader)
                ),
                # Charge la relation 'mappings'
                selectinload(models.Dataset.mappings)
            )
        )
        result = await db.execute(query)
        dataset = result.scalars().first()

        if not dataset:
            raise ResourceNotFoundError("Jeu de données non trouvé ou accès non autorisé.")
        
        # Le mapping de l'ORM vers Pydantic se chargera de construire les objets FileOut
        # y compris le `uploader_name` grâce au `joinedload`.
        return dataset

    async def create(
        self, db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User
    ) -> models.Dataset:
        """Crée un nouveau jeu de données."""
        new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
        db.add(new_dataset)
        await db.commit()
        await db.refresh(new_dataset)
        logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par {owner.id}.")
        return new_dataset

    async def get_multi_by_owner(
        self, db: AsyncSession, owner_id: uuid.UUID, skip: int, limit: int
    ) -> List[models.Dataset]:
        """Récupère une liste paginée de datasets pour un propriétaire."""
        query = select(models.Dataset).where(models.Dataset.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def remove(self, db: AsyncSession, dataset_id: uuid.UUID):
        """Supprime un dataset. La cascade gère la suppression des entités liées."""
        dataset = await db.get(models.Dataset, dataset_id)
        if dataset:
            await db.delete(dataset)
            await db.commit()
            logger.info(f"Dataset ID {dataset_id} et ses données associées ont été supprimés.")