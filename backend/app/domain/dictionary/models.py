""" app/domain/dictionary/models.py """
import uuid
from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.db import Base


class Dictionary(Base):
    """
    Modèle SQLAlchemy pour un Dictionary.
    Un Dictionary contient des listes de valeurs (stopwords, synonymes, etc.) avec versioning.
    """
    __tablename__ = "dictionaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False, index=True)  # "stopwords", "synonyms", "custom"
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relations
    owner = relationship("User", back_populates="dictionaries")
    versions = relationship("DictionaryVersion", back_populates="dictionary", cascade="all, delete-orphan", order_by="DictionaryVersion.version.desc()")


class DictionaryVersion(Base):
    """
    Modèle SQLAlchemy pour une version de Dictionary.
    Chaque version contient les données et métadonnées spécifiques.
    """
    __tablename__ = "dictionary_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dictionary_id = Column(UUID(as_uuid=True), ForeignKey("dictionaries.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    data = Column(JSONB, nullable=False)  # Contenu du dictionnaire (list, dict, etc.)
    is_active = Column(Boolean, default=True, index=True)  # Version active
    version_metadata = Column(JSONB, nullable=True)  # Métadonnées supplémentaires
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Relations
    dictionary = relationship("Dictionary", back_populates="versions")
    creator = relationship("User", back_populates="dictionary_versions")

    # Contrainte d'unicité sur dictionary_id + version
    __table_args__ = (
        # Cette contrainte sera ajoutée via une migration si nécessaire
    )
