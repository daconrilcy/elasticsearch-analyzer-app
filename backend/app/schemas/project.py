from pydantic import BaseModel
from typing import Optional
from app.schemas.analyzer_graph import AnalyzerGraph

# Schéma pour la création d'un projet
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph

# Schéma pour la mise à jour d'un projet
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[AnalyzerGraph] = None

# Schéma pour la réponse de l'API (ce que le frontend reçoit)
class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    graph: AnalyzerGraph

    class Config:
        from_attributes = True # Anciennement 'orm_mode'
