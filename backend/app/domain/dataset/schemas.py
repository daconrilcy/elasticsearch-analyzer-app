""" app/domain/dataset/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict, field_validator, ValidationInfo
from datetime import datetime
from typing import Optional, List, Dict, Any

from .models import FileStatus, IngestionStatus

# --- Schémas pour Dataset ---

class DatasetBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Le nom du dataset.")
    description: Optional[str] = None

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

# --- Schémas pour File ---

class FileOut(BaseModel):
    """Schéma de sortie pour une liste de fichiers (vue sommaire)."""
    id: uuid.UUID
    filename_original: str
    created_at: datetime
    version: int
    size_bytes: int
    status: FileStatus
    ingestion_status: IngestionStatus
    ingestion_errors: Optional[List[str]] = None

    @field_validator('ingestion_errors', mode='before')
    @classmethod
    def validate_ingestion_errors(cls, v):
        # Accepte None ou list, mais jamais str
        if v is None:
            return v
        if isinstance(v, str):
            # Essaie de charger la chaîne JSON au cas où c’est une string JSON
            import json
            try:
                v2 = json.loads(v)
                if isinstance(v2, list):
                    return v2
            except Exception:
                pass
            raise ValueError("ingestion_errors doit être une liste ou null, jamais une chaîne.")
        if not isinstance(v, list):
            raise ValueError("ingestion_errors doit être une liste ou null.")
        return v
    
    model_config = ConfigDict(from_attributes=True)

class FileDetailOut(FileOut):
    """Schéma de sortie pour les détails complets d'un fichier."""
    hash: str
    inferred_schema: Optional[Dict[str, Any]] = None
    docs_indexed: Optional[int] = None
    ingestion_errors: Optional[List[str]] = None
    uploader_id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)

# --- Schémas pour Mapping ---

class MappingRule(BaseModel):
    """Définit une règle de mapping d'un champ source vers un champ cible."""
    source: str = Field(..., description="Nom de la colonne dans le fichier source.")
    target: str = Field(..., description="Nom du champ dans l'index Elasticsearch cible.")
    es_type: str = Field(..., description="Type de données Elasticsearch (ex: keyword, text, integer).")
    analyzer_project_id: Optional[uuid.UUID] = Field(None, description="ID du projet d'analyseur à appliquer.")

    @field_validator('analyzer_project_id')
    @classmethod
    def analyzer_only_for_text(cls, v: Optional[uuid.UUID], info: ValidationInfo) -> Optional[uuid.UUID]:
        if v is not None and info.data.get('es_type') != 'text':
            raise ValueError("Un analyseur ne peut être appliqué qu'aux champs de type 'text'.")
        return v

class MappingBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    source_file_id: uuid.UUID
    mapping_rules: List[MappingRule]

class MappingCreate(MappingBase):
    pass

class MappingUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    mapping_rules: Optional[List[MappingRule]] = None

class MappingOut(MappingBase):
    id: uuid.UUID
    dataset_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    index_name: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

# --- Schéma composite pour la vue détaillée du Dataset ---

class DatasetDetailOut(DatasetOut):
    """Vue détaillée d'un dataset incluant ses fichiers et mappings."""
    files: List[FileOut] = []
    mappings: List[MappingOut] = []

    model_config = ConfigDict(from_attributes=True)

# --- Schémas pour la recherche Elasticsearch ---

class SearchHit(BaseModel):
    score: Optional[float] = Field(None, alias="_score")
    source: Dict[str, Any] = Field(..., alias="_source")
    
    model_config = ConfigDict(populate_by_name=True)

class SearchResults(BaseModel):
    total: int
    hits: List[SearchHit]
    page: int
    size: int
