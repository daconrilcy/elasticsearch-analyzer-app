import uuid
import enum
from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Enum as SQLAlchemyEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base
from app.utils.db_types import JSONOrJSONB # En supposant que ce type custom existe

# --- Enums pour les statuts ---

class FileStatus(str, enum.Enum):
    """Statut du cycle de vie d'un fichier."""
    PENDING = "pending"    # Le fichier est uploadé et en attente de traitement.
    PARSING = "parsing"    # Le parsing du fichier est en cours.
    READY = "ready"        # Le fichier est parsé avec succès et prêt à être utilisé.
    ERROR = "error"        # Une erreur est survenue durant le parsing.

class IngestionStatus(str, enum.Enum):
    """Statut de l'ingestion des données dans Elasticsearch."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

# --- Modèles de tables ---

class Dataset(Base):
    """
    Modèle SQLAlchemy pour un Dataset.
    Un Dataset est un conteneur logique pour des fichiers et des mappings.
    """
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relations
    owner = relationship("User")
    files = relationship("File", back_populates="dataset", cascade="all, delete-orphan")
    mappings = relationship("Mapping", back_populates="dataset", cascade="all, delete-orphan")


class File(Base):
    """
    Modèle SQLAlchemy pour un fichier (anciennement UploadedFile).
    Représente une version d'un fichier de données au sein d'un dataset.
    """
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename_original = Column(String, nullable=False)
    filename_stored = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    version = Column(Integer, nullable=False)
    hash = Column(String, nullable=False, index=True)
    size_bytes = Column(Integer, nullable=False)
    status = Column(SQLAlchemyEnum(FileStatus), nullable=False, default=FileStatus.PENDING)
    
    # Métadonnées extraites et statut d'ingestion
    inferred_schema = Column(JSONOrJSONB, nullable=True)
    ingestion_status = Column(SQLAlchemyEnum(IngestionStatus), nullable=False, default=IngestionStatus.NOT_STARTED)
    docs_indexed = Column(Integer, nullable=True)
    ingestion_errors = Column(JSONOrJSONB, nullable=True)
    
    # Clés étrangères
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relations
    dataset = relationship("Dataset", back_populates="files")
    uploader = relationship("User")


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
    source_file = relationship("File")
