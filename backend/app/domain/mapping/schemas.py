""" app/domain/mapping/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict, field_validator, ValidationInfo
from datetime import datetime
from typing import Optional, List, Any, Dict


class MappingRule(BaseModel):
    """Définit une règle de mapping d'un champ source vers un champ cible."""
    source: str = Field(..., description="Nom de la colonne dans le fichier source.")
    target: str = Field(..., description="Nom du champ dans l'index Elasticsearch cible.")
    es_type: str = Field(..., description="Type de données Elasticsearch (ex: keyword, text, integer).")
    analyzer_project_id: Optional[uuid.UUID] = Field(None, description="ID du projet d'analyseur à appliquer (pour le type 'text').")

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


# Nouveaux schémas pour l'API de validation DSL
class ValidationIssueModel(BaseModel):
    code: str
    path: str
    msg: str


class ValidateOut(BaseModel):
    errors: List[ValidationIssueModel] = []
    warnings: List[ValidationIssueModel] = []
    field_stats: List[Dict[str, Any]] = []  # À remplir plus tard
    compiled: Optional[Dict[str, Any]] = None


class DryRunIssue(BaseModel):
    row: int
    field: str
    code: str
    msg: str


class FieldStat(BaseModel):
    source: str
    non_null: int
    null_rate: float
    unique: int
    unique_ratio: float
    avg_len: float
    max_len: int
    examples: List[Any] = []
    candidates: Dict[str, float] = {}  # score par type

class InferSuggestion(BaseModel):
    source: str
    es_type: str               # "keyword" | "text" | "boolean" | "integer" | "long" | "double" | "date" | "ip" | "geo_point"
    confidence: float
    reasons: List[str] = []
    extras: Dict[str, Any] = {}  # ex: {"format":"yyyy-MM-dd HH:mm:ss||epoch_millis"}

class InferTypesOut(BaseModel):
    field_stats: List[FieldStat]
    suggestions: List[InferSuggestion]

class SizeFieldBreakdown(BaseModel):
    target: str
    type: str
    per_doc_bytes: int

class EstimateSizeOut(BaseModel):
    per_doc_bytes: int
    primary_size_bytes: int
    total_size_bytes: int
    recommended_shards: int
    target_shard_size_gb: int


class CheckIdsOut(BaseModel):
    """Résultat de la vérification des collisions d'ID."""
    total: int
    duplicates: int
    duplicate_rate: float
    samples: List[Dict[str, Any]] = []

class DryRunOut(BaseModel):
    docs_preview: List[Dict[str, Any]] = []
    issues: List[DryRunIssue] = []
    stats: Dict[str, Any] = {}  # {"issues_per_code": {...}, "date_fail_per_field": {...}}


class CompileOut(BaseModel):
    settings: Dict[str, Any]
    mappings: Dict[str, Any]
    execution_plan: Optional[List[Dict[str, Any]]] = None
    compiled_hash: Optional[str] = None


# --- Schémas pour le versioning des mappings ---

class MappingVersionBase(BaseModel):
    dsl_content: Dict[str, Any] = Field(..., description="Contenu du mapping DSL")
    description: Optional[str] = Field(None, description="Description de la version")
    version_metadata: Optional[Dict[str, Any]] = Field(None, description="Métadonnées supplémentaires")

class MappingVersionCreate(MappingVersionBase):
    pass

class MappingVersionUpdate(BaseModel):
    dsl_content: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    version_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class MappingVersionOut(MappingVersionBase):
    id: uuid.UUID
    mapping_id: uuid.UUID
    version: int
    is_active: bool
    compiled_mapping: Optional[Dict[str, Any]] = None
    compiled_hash: Optional[str] = None
    created_at: datetime
    created_by: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# --- Schémas composites pour Mapping ---

class MappingDetailOut(MappingOut):
    """Vue détaillée d'un mapping incluant ses versions."""
    versions: List[MappingVersionOut] = []
    active_version: Optional[MappingVersionOut] = None
    model_config = ConfigDict(from_attributes=True)

class MappingWithActiveVersion(MappingOut):
    """Vue d'un mapping avec sa version active."""
    active_version: Optional[MappingVersionOut] = None
    model_config = ConfigDict(from_attributes=True)



