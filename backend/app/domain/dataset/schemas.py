# app/domain/dataset/schemas.py
import uuid
from pydantic import BaseModel, field_validator, Field, ValidationInfo
from datetime import datetime
from typing import Optional, List, Dict, Any
from .models import FileStatus, IngestionStatus


# --- Schémas pour UploadedFile ---
class FileSchemaField(BaseModel):
    field: str
    type: str

class FileUploadResponse(BaseModel):
    file_id: str
    schema: List[FileSchemaField]


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
    inferred_schema: Optional[Dict[str, Any]] = None
    ingestion_status: IngestionStatus
    docs_indexed: Optional[int] = None
    ingestion_errors: Optional[List[str]] = None

    class Config:
        from_attributes = True


# --- Schémas pour la requête d'ingestion ---
class IngestRequest(BaseModel):
    mapping_id: uuid.UUID


# --- Schémas pour SchemaMapping ---
class MappingRule(BaseModel):
    source: str = Field(..., description="Nom de la colonne dans le fichier source.")
    target: str = Field(..., description="Nom du champ dans l'index Elasticsearch cible.")
    es_type: str = Field(..., description="Type de données Elasticsearch (ex: keyword, text, integer).")
    analyzer_project_id: Optional[uuid.UUID] = Field(None, description="ID du projet d'analyseur à appliquer (si es_type est 'text').")

    # CORRECTION: Ajout de @classmethod pour résoudre l'erreur Pydantic.
    # Le décorateur @field_validator doit être appliqué à une méthode de classe.
    @field_validator('analyzer_project_id')
    @classmethod
    def analyzer_only_for_text(cls, v: Optional[uuid.UUID], info: ValidationInfo) -> Optional[uuid.UUID]:
        """Valide qu'un analyseur n'est appliqué qu'à un champ de type 'text'."""
        # 'info.data' contient les autres champs du modèle déjà validés.
        if v is not None and info.data.get('es_type') != 'text':
            raise ValueError("Un analyseur ne peut être appliqué qu'aux champs 'text'.")
        return v


class SchemaMappingCreate(BaseModel):
    name: str
    source_file_id: uuid.UUID
    mapping_rules: List[MappingRule]


class SchemaMappingUpdate(BaseModel):
    name: Optional[str] = None
    mapping_rules: Optional[List[MappingRule]] = None


class SchemaMappingOut(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    name: str
    source_file_id: uuid.UUID
    mapping_rules: List[MappingRule]
    created_at: datetime
    updated_at: datetime
    index_name: Optional[str]

    class Config:
        from_attributes = True


# --- Les autres schémas (DatasetCreate, etc.) restent inchangés ---
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
    mappings: List[SchemaMappingOut] = []


# --- SCHÉMAS POUR LA RECHERCHE ---

class SearchQuery(BaseModel):
    query: str = Field(..., description="Le terme de recherche.")
    page: int = Field(1, ge=1, description="Le numéro de la page.")
    size: int = Field(10, ge=1, le=100, description="Le nombre de résultats par page.")


class SearchHit(BaseModel):
    score: Optional[float] = Field(None, alias="_score")
    source: Dict[str, Any] = Field(..., alias="_source")


class SearchResults(BaseModel):
    total: int
    hits: List[SearchHit]
    page: int
    size: int
