"""app/domain/project/models.py"""

import enum
import uuid
from datetime import datetime, UTC
from typing import Type

from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, DateTime, ForeignKey
from sqlalchemy.types import JSON as SQLALCHEMY_JSON
from sqlalchemy.orm import DeclarativeMeta
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

from app.core.db import Base


def get_json_type(model_cls: Type[DeclarativeMeta]):
    """
    Retourne JSONB si PostgreSQL, sinon JSON standard (SQLite, etc.).
    Utilisé pour les tests multiplateformes.
    """
    try:
        dialect = model_cls.metadata.bind.dialect
        return JSONB if dialect.name == "postgresql" else SQLALCHEMY_JSON
    except AttributeError:
        # Cas fréquent en test ou si bind non défini
        return SQLALCHEMY_JSON


def get_uuid_type(model_cls: Type[DeclarativeMeta]):
    """
    Retourne UUID natif pour PostgreSQL, sinon String(36) (SQLite, etc.).
    """
    try:
        dialect = model_cls.metadata.bind.dialect
        return PG_UUID(as_uuid=True) if dialect.name == "postgresql" else String(36)
    except AttributeError:
        return String(36)


def get_uuid_type_and_default(cls: type[Base]) -> tuple:
    """
    Retourne le type UUID et le default adapté au dialecte.
    - PG_UUID + uuid.uuid4 pour PostgreSQL
    - String(36) + str(uuid.uuid4) pour SQLite
    """
    try:
        dialect = cls.metadata.bind.dialect
        if dialect.name == "postgresql":
            return PG_UUID(as_uuid=True), uuid.uuid4
    except AttributeError:
        pass
    return String(36), lambda: str(uuid.uuid4())


def generate_uuid(dialect_name: str):
    """
    Génère un UUID adapté au dialecte.
    - PostgreSQL : UUID natif
    - SQLite : chaîne UUID
    """
    return uuid.uuid4 if dialect_name == "postgresql" else lambda: str(uuid.uuid4())


class ProjectStatus(str, enum.Enum):
    """
    Statut d’un projet d’analyseur.
    """
    DRAFT = "draft"
    VALIDATED = "validated"
    PUBLISHED = "published"


uuid_type, uuid_default = get_uuid_type_and_default(Base)


class Project(Base):
    """
    Modèle SQLAlchemy du projet compatible PostgreSQL et SQLite (pour tests).
    """
    __tablename__ = "projects"

    id = Column(uuid_type, primary_key=True, default=uuid_default)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    graph = Column(get_json_type(Base), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(SQLAlchemyEnum(ProjectStatus), nullable=False, default=ProjectStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    owner_id = Column(
        uuid_type,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="UUID du propriétaire (user)"
    )
