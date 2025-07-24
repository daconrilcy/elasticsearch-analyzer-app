# app/domain/project/schemas.py
from pydantic import BaseModel
from typing import Optional
from app.domain.analyzer.models import AnalyzerGraph
from .models import ProjectStatus
import uuid


# Schéma pour la création d'un projet. Le statut et la version sont gérés par défaut.
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph


# Schéma pour la mise à jour. Permet de changer le nom, la description, le graphe ou le statut.
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[AnalyzerGraph] = None
    status: Optional[ProjectStatus] = None  # Permet de changer le statut via l'API


# Schéma pour les réponses de l'API, incluant les nouveaux champs.
class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph
    version: int  # Champ de version ajouté
    status: ProjectStatus  # Champ de statut ajouté

    class Config:
        from_attributes = True
