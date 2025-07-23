# app/api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app.core.db import get_db
from backend.app.domain.project import services, schemas
from backend.app.domain.analyzer.services import convert_graph_to_es_analyzer
from backend.app.domain.analyzer.models import AnalyzerGraph

router = APIRouter()


@router.post("/", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
        project_in: schemas.ProjectCreate,
        db: AsyncSession = Depends(get_db)
):
    """Crée un nouveau projet d'analyseur."""
    return await services.create_project(db=db, project_in=project_in)


@router.get("/", response_model=List[schemas.ProjectOut])
async def get_all_projects_endpoint(db: AsyncSession = Depends(get_db)):
    """Récupère la liste de tous les projets."""
    return await services.get_all_projects(db=db)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
async def get_project_endpoint(project_id: int, db: AsyncSession = Depends(get_db)):
    """Récupère un projet par son ID."""
    db_project = await services.get_project(db=db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    return db_project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
async def update_project_endpoint(
        project_id: int,
        project_in: schemas.ProjectUpdate,
        db: AsyncSession = Depends(get_db)
):
    """Met à jour un projet. La version est incrémentée si le nom ou le graphe change."""
    db_project = await services.get_project(db=db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    return await services.update_project(db=db, db_project=db_project, project_in=project_in)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(project_id: int, db: AsyncSession = Depends(get_db)):
    """Supprime un projet."""
    db_project = await services.get_project(db=db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    await services.delete_project(db=db, project=db_project)
    return None


@router.get("/{project_id}/export", response_model=dict)
async def export_project_config_endpoint(project_id: int, db: AsyncSession = Depends(get_db)):
    """Génère la configuration JSON de l'analyseur pour un projet."""
    db_project = await services.get_project(db=db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    graph_data = AnalyzerGraph.model_validate(db_project.graph)
    analyzer_config = convert_graph_to_es_analyzer(graph_data)

    export_json = {
        "analysis": {
            "analyzer": {
                f"custom_{db_project.name.lower().replace(' ', '_')}": analyzer_config
            }
        }
    }
    return export_json
