import uuid
from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


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
    owner = relationship("User", back_populates="datasets")
    files = relationship("File", back_populates="dataset", cascade="all, delete-orphan")
    mappings = relationship("Mapping", back_populates="dataset", cascade="all, delete-orphan")
