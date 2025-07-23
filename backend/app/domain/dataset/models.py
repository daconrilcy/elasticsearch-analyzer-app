""" app/domain/dataset/models.py """
import uuid
import enum
from datetime import datetime, UTC
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.db import Base


class FileStatus(str, enum.Enum):
    PENDING = "pending"
    PARSED = "parsed"
    ERROR = "error"


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(UTC))
    updated_at = Column(DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))

    owner = relationship("User")
    files = relationship("UploadedFile", back_populates="dataset", cascade="all, delete-orphan")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    filename_original = Column(String, nullable=False)
    filename_stored = Column(String, nullable=False, unique=True)
    version = Column(Integer, nullable=False)
    hash = Column(String, nullable=False, index=True)
    upload_date = Column(DateTime, default=datetime.now(UTC))
    size_bytes = Column(Integer, nullable=False)
    status = Column(SQLAlchemyEnum(FileStatus), nullable=False, default=FileStatus.PENDING)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    dataset = relationship("Dataset", back_populates="files")
    uploader = relationship("User")
