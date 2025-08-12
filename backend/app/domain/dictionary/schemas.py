""" app/domain/dictionary/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any, Union


# --- Schémas pour Dictionary ---

class DictionaryBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Le nom du dictionnaire.")
    description: Optional[str] = Field(None, description="Une description facultative du dictionnaire.")
    type: str = Field(..., description="Type de dictionnaire (stopwords, synonyms, custom)")

class DictionaryCreate(DictionaryBase):
    pass

class DictionaryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    type: Optional[str] = None

class DictionaryOut(DictionaryBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Schémas pour DictionaryVersion ---

class DictionaryVersionBase(BaseModel):
    data: Union[List[str], Dict[str, Any], str] = Field(..., description="Contenu du dictionnaire")
    version_metadata: Optional[Dict[str, Any]] = Field(None, description="Métadonnées supplémentaires")

class DictionaryVersionCreate(DictionaryVersionBase):
    pass

class DictionaryVersionUpdate(BaseModel):
    data: Optional[Union[List[str], Dict[str, Any], str]] = None
    version_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class DictionaryVersionOut(DictionaryVersionBase):
    id: uuid.UUID
    dictionary_id: uuid.UUID
    version: int
    is_active: bool
    created_at: datetime
    created_by: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# --- Schémas composites ---

class DictionaryDetailOut(DictionaryOut):
    """Vue détaillée d'un dictionnaire incluant ses versions."""
    versions: List[DictionaryVersionOut] = []
    active_version: Optional[DictionaryVersionOut] = None
    model_config = ConfigDict(from_attributes=True)

class DictionaryWithActiveVersion(DictionaryOut):
    """Vue d'un dictionnaire avec sa version active."""
    active_version: Optional[DictionaryVersionOut] = None
    model_config = ConfigDict(from_attributes=True)


# --- Schémas pour la recherche ---

class DictionarySearchResults(BaseModel):
    total: int
    dictionaries: List[DictionaryWithActiveVersion]
    page: int
    size: int
