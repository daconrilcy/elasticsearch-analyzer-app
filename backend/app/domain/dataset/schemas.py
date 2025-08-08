""" app/domain/dataset/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.domain.file.schemas import FileOut
from app.domain.mapping.schemas import MappingOut


# --- Schémas pour Dataset ---

class DatasetBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Le nom du jeu de données.")
    description: Optional[str] = Field(None, description="Une description facultative du jeu de données.")

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None

class DatasetOut(DatasetBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Schéma composite ---

class DatasetDetailOut(DatasetOut):
    """Vue détaillée d'un dataset incluant ses fichiers et mappings."""
    files: List[FileOut] = []  # Utilise maintenant le schéma de fichier unifié et détaillé
    mappings: List[MappingOut] = []
    model_config = ConfigDict(from_attributes=True)

# --- Schémas pour la recherche ---

class SearchHit(BaseModel):
    score: Optional[float] = Field(None, alias="_score")
    source: Dict[str, Any] = Field(..., alias="_source")
    model_config = ConfigDict(populate_by_name=True)

class SearchResults(BaseModel):
    total: int
    hits: List[SearchHit]
    page: int
    size: int