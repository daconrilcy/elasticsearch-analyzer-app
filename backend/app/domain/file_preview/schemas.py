"""Schémas Pydantic pour les aperçus de fichiers."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FilePreviewRequest(BaseModel):
    chunk_index: int = Field(0, ge=0)
    chunk_size: int = Field(100, ge=1, le=10_000)


class FilePreviewChunk(BaseModel):
    chunk_index: int
    chunk_size: int
    total_rows: Optional[int] = None
    total_chunks: Optional[int] = None
    rows: List[Dict[str, Any]]





