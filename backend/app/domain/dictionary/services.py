""" app/domain/dictionary/services.py """
import uuid
from typing import Optional, List, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload, joinedload
from loguru import logger

from app.domain.dictionary import models, schemas
from app.domain.user.models import User
from app.core.exceptions import (
    ResourceNotFoundError,
    ForbiddenError
)


class DictionaryService:
    """Service pour les opérations CRUD sur l'entité Dictionary avec versioning."""

    async def get(self, db: AsyncSession, dictionary_id: uuid.UUID) -> Optional[models.Dictionary]:
        """Récupère un dictionnaire par son ID."""
        return await db.get(models.Dictionary, dictionary_id)

    async def get_owned_by_user(
        self, db: AsyncSession, dictionary_id: uuid.UUID, user: User
    ) -> models.Dictionary:
        """Récupère un dictionnaire et vérifie la propriété."""
        dictionary = await db.get(models.Dictionary, dictionary_id)
        if not dictionary:
            raise ResourceNotFoundError("Dictionnaire non trouvé.")
        
        if dictionary.owner_id != user.id:
            raise ForbiddenError("Accès non autorisé à ce dictionnaire.")
        
        return dictionary

    async def get_with_versions(
        self, db: AsyncSession, dictionary_id: uuid.UUID, user: User
    ) -> models.Dictionary:
        """Récupère un dictionnaire avec toutes ses versions."""
        query = (
            select(models.Dictionary)
            .where(models.Dictionary.id == dictionary_id, models.Dictionary.owner_id == user.id)
            .options(
                selectinload(models.Dictionary.versions).options(
                    joinedload(models.DictionaryVersion.creator)
                )
            )
        )
        result = await db.execute(query)
        dictionary = result.scalars().first()

        if not dictionary:
            raise ResourceNotFoundError("Dictionnaire non trouvé ou accès non autorisé.")
        
        return dictionary

    async def create(
        self, db: AsyncSession, dictionary_in: schemas.DictionaryCreate, owner: User
    ) -> Tuple[models.Dictionary, models.DictionaryVersion]:
        """Crée un nouveau dictionnaire avec sa première version."""
        # Créer le dictionnaire
        new_dictionary = models.Dictionary(**dictionary_in.model_dump(), owner_id=owner.id)
        db.add(new_dictionary)
        await db.flush()  # Pour obtenir l'ID
        
        # Créer la première version
        first_version = models.DictionaryVersion(
            dictionary_id=new_dictionary.id,
            version=1,
            data=dictionary_in.data,
            version_metadata=dictionary_in.version_metadata,
            created_by=owner.id,
            is_active=True
        )
        db.add(first_version)
        
        await db.commit()
        await db.refresh(new_dictionary)
        await db.refresh(first_version)
        
        logger.info(f"Dictionnaire '{new_dictionary.name}' (ID: {new_dictionary.id}) créé par {owner.id} avec version 1.")
        return new_dictionary, first_version

    async def update(
        self, db: AsyncSession, dictionary_id: uuid.UUID, dictionary_in: schemas.DictionaryUpdate, user: User
    ) -> models.Dictionary:
        """Met à jour un dictionnaire existant."""
        dictionary = await self.get_owned_by_user(db, dictionary_id, user)
        
        update_data = dictionary_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(dictionary, field, value)
        
        await db.commit()
        await db.refresh(dictionary)
        logger.info(f"Dictionnaire {dictionary_id} mis à jour.")
        return dictionary

    async def create_version(
        self, db: AsyncSession, dictionary_id: uuid.UUID, version_in: schemas.DictionaryVersionCreate, user: User
    ) -> models.DictionaryVersion:
        """Crée une nouvelle version d'un dictionnaire."""
        dictionary = await self.get_owned_by_user(db, dictionary_id, user)
        
        # Désactiver l'ancienne version active
        if version_in.is_active:
            await self._deactivate_current_version(db, dictionary_id)
        
        # Obtenir le numéro de la prochaine version
        next_version = await self._get_next_version_number(db, dictionary_id)
        
        # Créer la nouvelle version
        new_version = models.DictionaryVersion(
            dictionary_id=dictionary_id,
            version=next_version,
            data=version_in.data,
            metadata=version_in.metadata,
            created_by=user.id,
            is_active=version_in.is_active or False
        )
        db.add(new_version)
        
        await db.commit()
        await db.refresh(new_version)
        
        logger.info(f"Version {next_version} du dictionnaire {dictionary_id} créée par {user.id}.")
        return new_version

    async def update_version(
        self, db: AsyncSession, version_id: uuid.UUID, version_in: schemas.DictionaryVersionUpdate, user: User
    ) -> models.DictionaryVersion:
        """Met à jour une version de dictionnaire."""
        version = await self._get_version_by_id(db, version_id, user)
        
        update_data = version_in.model_dump(exclude_unset=True)
        
        # Si on active cette version, désactiver les autres
        if version_in.is_active:
            await self._deactivate_current_version(db, version.dictionary_id)
        
        for field, value in update_data.items():
            setattr(version, field, value)
        
        await db.commit()
        await db.refresh(version)
        logger.info(f"Version {version.version} du dictionnaire {version.dictionary_id} mise à jour.")
        return version

    async def get_multi_by_owner(
        self, db: AsyncSession, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[models.Dictionary]:
        """Récupère une liste paginée de dictionnaires pour un propriétaire."""
        query = (
            select(models.Dictionary)
            .where(models.Dictionary.owner_id == owner_id)
            .options(
                selectinload(models.Dictionary.versions).where(models.DictionaryVersion.is_active == True)
            )
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def remove(self, db: AsyncSession, dictionary_id: uuid.UUID, user: User):
        """Supprime un dictionnaire et toutes ses versions."""
        dictionary = await self.get_owned_by_user(db, dictionary_id, user)
        
        await db.delete(dictionary)
        await db.commit()
        logger.info(f"Dictionnaire ID {dictionary_id} et ses versions ont été supprimés.")

    async def remove_version(self, db: AsyncSession, version_id: uuid.UUID, user: User):
        """Supprime une version spécifique d'un dictionnaire."""
        version = await self._get_version_by_id(db, version_id, user)
        
        # Vérifier qu'il ne s'agit pas de la seule version
        total_versions = await self._count_versions(db, version.dictionary_id)
        if total_versions <= 1:
            raise ValueError("Impossible de supprimer la seule version d'un dictionnaire.")
        
        await db.delete(version)
        await db.commit()
        logger.info(f"Version {version.version} du dictionnaire {version.dictionary_id} supprimée.")

    # Méthodes privées

    async def _deactivate_current_version(self, db: AsyncSession, dictionary_id: uuid.UUID):
        """Désactive la version active actuelle d'un dictionnaire."""
        query = (
            select(models.DictionaryVersion)
            .where(
                and_(
                    models.DictionaryVersion.dictionary_id == dictionary_id,
                    models.DictionaryVersion.is_active == True
                )
            )
        )
        result = await db.execute(query)
        active_versions = result.scalars().all()
        
        for version in active_versions:
            version.is_active = False

    async def _get_next_version_number(self, db: AsyncSession, dictionary_id: uuid.UUID) -> int:
        """Obtient le numéro de la prochaine version."""
        query = (
            select(func.max(models.DictionaryVersion.version))
            .where(models.DictionaryVersion.dictionary_id == dictionary_id)
        )
        result = await db.execute(query)
        max_version = result.scalar()
        return (max_version or 0) + 1

    async def _get_version_by_id(self, db: AsyncSession, version_id: uuid.UUID, user: User) -> models.DictionaryVersion:
        """Récupère une version par son ID et vérifie les permissions."""
        version = await db.get(models.DictionaryVersion, version_id)
        if not version:
            raise ResourceNotFoundError("Version non trouvée.")
        
        # Vérifier que l'utilisateur possède le dictionnaire
        dictionary = await self.get_owned_by_user(db, version.dictionary_id, user)
        return version

    async def _count_versions(self, db: AsyncSession, dictionary_id: uuid.UUID) -> int:
        """Compte le nombre de versions d'un dictionnaire."""
        query = select(func.count(models.DictionaryVersion.id)).where(
            models.DictionaryVersion.dictionary_id == dictionary_id
        )
        result = await db.execute(query)
        return result.scalar()
