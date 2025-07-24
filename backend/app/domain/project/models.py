# app/domain/project/models.py
import enum
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from app.core.db import Base
import uuid


# Énumération pour les statuts possibles d'un projet.
class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    PUBLISHED = "published"


class Project(Base):
    """
    Modèle de données SQLAlchemy pour un projet d'analyseur.
    Inclut maintenant la gestion de la version et du statut.
    """
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)

    # Le graphe de l'analyseur stocké au format JSONB.
    graph = Column(JSONB, nullable=False)

    # NOUVEAUX CHAMPS
    # Version du projet, incrémentée à chaque modification majeure.
    version = Column(Integer, nullable=False, default=1)
    # Statut du projet (brouillon, validé, etc.).
    status = Column(SQLAlchemyEnum(ProjectStatus), nullable=False, default=ProjectStatus.DRAFT)
