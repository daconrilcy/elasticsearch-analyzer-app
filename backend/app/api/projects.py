from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.db import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.analyzer_graph import AnalyzerGraph
# On importe le convertisseur de graphe pour la fonction d'export
from app.services.graph_converter import convert_graph_to_es_analyzer

router = APIRouter()

@router.post("/", response_model=ProjectOut, status_code=201)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Crée un nouveau projet d'analyseur."""
    graph_data_for_db = project_in.graph.model_dump(mode='json')

    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        graph=graph_data_for_db
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectOut])
async def get_all_projects(db: AsyncSession = Depends(get_db)):
    """Récupère la liste de tous les projets."""
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    return projects

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Récupère un projet par son ID."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return project

@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Met à jour un projet (nom, description ou graphe)."""
    db_project = await db.get(Project, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    update_data = project_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "graph" and project_in.graph:
            setattr(db_project, key, project_in.graph.model_dump(mode='json'))
        else:
            setattr(db_project, key, value)

    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Supprime un projet."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    await db.delete(project)
    await db.commit()
    return None

# NOUVELLE ROUTE POUR L'EXPORT
@router.get("/{project_id}/export")
async def export_project_config(project_id: int, db: AsyncSession = Depends(get_db)):
    """
    Génère et retourne la configuration JSON pure de l'analyseur pour un projet donné.
    """
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    graph_data = AnalyzerGraph.model_validate(project.graph)
    
    analyzer_config = convert_graph_to_es_analyzer(graph_data)
    
    export_json = {
        "analysis": {
            "analyzer": {
                f"custom_{project.name.lower().replace(' ', '_')}": analyzer_config
            }
        }
    }
    
    return export_json
