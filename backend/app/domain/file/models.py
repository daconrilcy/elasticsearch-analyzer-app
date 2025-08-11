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
from sqlalchemy.sql import func

from app.core.db import Base
from app.utils.db_types import JSONOrJSONB


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
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    version = Column(Integer, nullable=False)
    hash = Column(String, nullable=False, index=True)
    size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=True)
    status = Column(SQLAlchemyEnum(FileStatus), nullable=False, default=FileStatus.PENDING)
    
    # Métadonnées extraites et statut d'ingestion
    inferred_schema = Column(JSONOrJSONB, nullable=True)
    ingestion_status = Column(SQLAlchemyEnum(IngestionStatus), nullable=False, default=IngestionStatus.NOT_STARTED)
    docs_indexed = Column(Integer, nullable=True)
    ingestion_errors = Column(JSONOrJSONB, nullable=True)
    parsing_error = Column(String, nullable=True)
    line_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    preview_data = Column(JSONOrJSONB, nullable=True)
    
    # Clés étrangères
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relations
    dataset = relationship("Dataset", back_populates="files")
    uploader = relationship("User", back_populates="files")
    mappings = relationship("Mapping", back_populates="source_file", cascade="all, delete-orphan")
