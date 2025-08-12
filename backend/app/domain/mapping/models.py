import uuid
from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.db import Base
from app.utils.db_types import JSONOrJSONB


class Mapping(Base):
    """
    Modèle SQLAlchemy pour un Mapping de schéma (anciennement SchemaMapping).
    Définit comment les colonnes d'un fichier source sont mappées
    vers les champs d'un index Elasticsearch.
    """
    __tablename__ = "mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    mapping_rules = Column(JSONOrJSONB, nullable=False)
    index_name = Column(String, nullable=True, unique=True)
    
    # Clés étrangères
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    source_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False)

    # Horodatage
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relations
    dataset = relationship("Dataset", back_populates="mappings")
    source_file = relationship("File", back_populates="mappings")
    versions = relationship("MappingVersion", back_populates="mapping", cascade="all, delete-orphan", order_by="MappingVersion.version.desc()")


class MappingVersion(Base):
    """
    Modèle SQLAlchemy pour une version de Mapping.
    Chaque version contient le DSL de mapping et les métadonnées spécifiques.
    """
    __tablename__ = "mapping_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mapping_id = Column(UUID(as_uuid=True), ForeignKey("mappings.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    
    # Contenu du mapping DSL
    dsl_content = Column(JSONB, nullable=False)  # Le mapping DSL complet
    compiled_mapping = Column(JSONB, nullable=True)  # Mapping ES compilé (cache)
    compiled_hash = Column(String(64), nullable=True, index=True)  # SHA256 du DSL normalisé pour idempotence
    
    # Métadonnées
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)  # Version active
    version_metadata = Column(JSONB, nullable=True)  # Métadonnées supplémentaires
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Relations
    mapping = relationship("Mapping", back_populates="versions")
    creator = relationship("User", back_populates="mapping_versions")

    # Contrainte d'unicité sur mapping_id + version
    __table_args__ = (
        # Cette contrainte sera ajoutée via une migration si nécessaire
    )
