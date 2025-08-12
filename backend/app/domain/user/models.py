"""backend/app/domain/user/models.py"""

import uuid
from sqlalchemy import Column, String, Boolean, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from app.core.db import Base
from app.utils.db_types import UuidType as CustomUUID
from app.domain.user.schemas import UserRole


class User(Base):
    """Modèle SQLAlchemy de l'utilisateur."""
    __tablename__ = "users"

    id = Column(CustomUUID, primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(SQLAlchemyEnum(UserRole), default=UserRole.USER)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("File", back_populates="uploader", cascade="all, delete-orphan")
    mapping_versions = relationship("MappingVersion", back_populates="creator", cascade="all, delete-orphan")
    dictionaries = relationship("Dictionary", back_populates="owner", cascade="all, delete-orphan")
    dictionary_versions = relationship("DictionaryVersion", back_populates="creator", cascade="all, delete-orphan")
