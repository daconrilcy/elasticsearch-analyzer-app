# app/domain/dataset/schemas.py
import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .models import FileStatus


# --- Schémas pour UploadedFile ---
class UploadedFileOut(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    filename_original: str
    filename_stored: str
    version: int
    hash: str
    size_bytes: int
    upload_date: datetime
    status: FileStatus
    uploader_id: uuid.UUID

    class Config:
        from_attributes = True


# --- Schémas pour Dataset ---
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DatasetOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetDetailOut(DatasetOut):
    files: List[UploadedFileOut] = []
