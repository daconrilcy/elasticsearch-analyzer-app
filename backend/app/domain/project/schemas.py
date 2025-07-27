# backend/app/domain/project/schemas.py

from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from app.domain.analyzer.models import AnalyzerGraph
from .models import ProjectStatus
import uuid


class ProjectCreate(BaseModel):
    """Schéma pour la création d'un projet."""
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph


class ProjectUpdate(BaseModel):
    """Schéma pour la mise à jour d'un projet."""
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[AnalyzerGraph] = None
    status: Optional[ProjectStatus] = None


class ProjectOut(BaseModel):
    """Schéma de réponse API pour un projet."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph
    version: int
    status: ProjectStatus

    model_config = ConfigDict(from_attributes=True)

    @field_validator('graph', mode='before')
    @classmethod
    def parse_graph(cls, v):
        if isinstance(v, dict):
            return AnalyzerGraph(**v)
        return v
