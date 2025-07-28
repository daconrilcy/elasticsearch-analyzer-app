""" backend/app/domain/project/models.py """

import enum
import uuid
from datetime import datetime, UTC

from sqlalchemy import (
    Column, Integer, String, Enum as SQLAlchemyEnum, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.db import Base
from app.utils.db_types import UuidType as CustomUUID, get_json_type


class ProjectStatus(str, enum.Enum):
    """
    Statut d’un projet d’analyseur.
    """
    DRAFT = "draft"
    VALIDATED = "validated"
    PUBLISHED = "published"


class Project(Base):
    """
    Modèle SQLAlchemy du projet.
    """
    __tablename__ = "projects"

    id = Column(CustomUUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    graph = Column(get_json_type(Base), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(SQLAlchemyEnum(ProjectStatus), nullable=False, default=ProjectStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    owner_id = Column(
        CustomUUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="UUID du propriétaire (user)"
    )

    # --- CORRECTION DE LA FAUTE DE FRAPPE ICI ---
    owner = relationship("User", back_populates="projects")
