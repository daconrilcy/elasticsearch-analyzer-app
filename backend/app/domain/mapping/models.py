import uuid
from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

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
