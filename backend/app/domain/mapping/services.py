import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.domain.mapping import models, schemas
from app.domain.user.models import User
from app.core.exceptions import (
    ResourceNotFoundError,
    ForbiddenError
)


class MappingService:
    """Service pour les opérations CRUD sur l'entité Mapping."""

    async def get(self, db: AsyncSession, mapping_id: uuid.UUID) -> Optional[models.Mapping]:
        """Récupère un mapping par son ID."""
        return await db.get(models.Mapping, mapping_id)

    async def get_owned_by_user(
        self, db: AsyncSession, mapping_id: uuid.UUID, user: User
    ) -> models.Mapping:
        """
        Récupère un mapping et vérifie la propriété via le dataset parent.
        """
        mapping = await db.get(models.Mapping, mapping_id)
        if not mapping:
            raise ResourceNotFoundError("Mapping non trouvé.")
        
        await db.refresh(mapping, attribute_names=['dataset'])
        if mapping.dataset.owner_id != user.id:
            raise ForbiddenError("Accès non autorisé à ce mapping.")
        return mapping

    async def create(
        self, db: AsyncSession, mapping_in: schemas.MappingCreate, dataset_id: uuid.UUID
    ) -> models.Mapping:
        """Crée un nouveau mapping."""
        from app.domain.file import models as file_models
        from fastapi import HTTPException, status
        
        # Vérifie que le fichier source existe et est prêt
        file = await db.get(file_models.File, mapping_in.source_file_id)
        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier source non trouvé.")
        
        if file.status != file_models.FileStatus.READY:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier n'est pas encore prêt pour le mapping.")
        
        if not file.inferred_schema:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier n'a pas de schéma inféré.")
        
        # Vérifie que les colonnes source existent dans le schéma
        schema_columns = set(file.inferred_schema.keys())
        for rule in mapping_in.mapping_rules:
            if rule.source not in schema_columns:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Colonne '{rule.source}' non trouvée dans le schéma du fichier.")
        
        new_mapping = models.Mapping(
            **mapping_in.model_dump(),
            dataset_id=dataset_id
        )
        db.add(new_mapping)
        await db.commit()
        await db.refresh(new_mapping)
        logger.info(f"Mapping '{new_mapping.name}' (ID: {new_mapping.id}) créé pour dataset {dataset_id}.")
        return new_mapping

    async def update(
        self, db: AsyncSession, mapping_id: uuid.UUID, mapping_in: schemas.MappingUpdate
    ) -> models.Mapping:
        """Met à jour un mapping existant."""
        mapping = await db.get(models.Mapping, mapping_id)
        if not mapping:
            raise ResourceNotFoundError("Mapping non trouvé.")
        
        update_data = mapping_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(mapping, field, value)
        
        await db.commit()
        await db.refresh(mapping)
        logger.info(f"Mapping {mapping_id} mis à jour.")
        return mapping

    async def remove(self, db: AsyncSession, mapping_id: uuid.UUID):
        """Supprime un mapping."""
        mapping = await db.get(models.Mapping, mapping_id)
        if mapping:
            await db.delete(mapping)
            await db.commit()
            logger.info(f"Mapping ID {mapping_id} supprimé.")

    async def get_by_dataset(
        self, db: AsyncSession, dataset_id: uuid.UUID
    ) -> List[models.Mapping]:
        """Récupère tous les mappings d'un dataset."""
        query = select(models.Mapping).where(models.Mapping.dataset_id == dataset_id)
        result = await db.execute(query)
        return result.scalars().all()
