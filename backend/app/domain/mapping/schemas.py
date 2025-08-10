""" app/domain/mapping/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict, field_validator, ValidationInfo
from datetime import datetime
from typing import Optional, List


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



