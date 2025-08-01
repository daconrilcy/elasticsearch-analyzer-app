"""
app/api/v1/projects.py
Routes pour les projets.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from loguru import logger
import uuid

from app.core.db import get_db
from app.domain.project import services, schemas
from app.domain.user.models import UserRole, User
from app.domain.analyzer.services import convert_graph_to_es_analyzer
from app.domain.analyzer.models import AnalyzerGraph
# --- CORRECTION : Utiliser la dépendance du cookie ---
from app.api.dependencies import get_current_user_from_cookie

router = APIRouter(
    # --- CORRECTION : Applique la dépendance du cookie à toutes les routes ---
    dependencies=[Depends(get_current_user_from_cookie)]
)


def log_project_creation(project_name: str) -> None:
    """Log la création du projet (fonction simulée)."""
    logger.info(f"[BackgroundTask] Projet '{project_name}' créé avec succès.")


async def _get_authorized_project(
    db: AsyncSession, project_id: uuid.UUID, user: User
) -> schemas.ProjectOut:
    """Récupère le projet et vérifie l'accès utilisateur."""
    project = await services.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    if user.role != UserRole.ADMIN and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Accès interdit")
    return project


@router.post("/", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: schemas.ProjectCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> schemas.ProjectOut:
    """Crée un nouveau projet pour l'utilisateur courant."""
    project = await services.create_project(db, project_in, user.id)
    background_tasks.add_task(log_project_creation, project.name)
    logger.info(f"Projet '{project.name}' créé.")
    return project


@router.get("/", response_model=List[schemas.ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> List[schemas.ProjectOut]:
    """Récupère tous les projets (selon rôle)."""
    if user.role == UserRole.ADMIN:
        return await services.get_all_projects(db)
    return await services.get_projects_by_owner(db, user.id)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> schemas.ProjectOut:
    """Récupère un projet par ID."""
    return await _get_authorized_project(db, project_id, user)


@router.put("/{project_id}", response_model=schemas.ProjectOut)
async def update_project(
    project_id: uuid.UUID,
    project_in: schemas.ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> schemas.ProjectOut:
    """Met à jour un projet existant si l'utilisateur y a accès."""
    project = await _get_authorized_project(db, project_id, user)
    return await services.update_project(db, project, project_in)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> Response:
    """Supprime un projet accessible à l'utilisateur."""
    project = await _get_authorized_project(db, project_id, user)
    await services.delete_project(db, project)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}/export", response_model=dict)
async def export_project_config(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_from_cookie),
) -> dict:
    """Exporte la configuration JSON Elasticsearch du projet."""
    project = await _get_authorized_project(db, project_id, user)
    graph_data = AnalyzerGraph.model_validate(project.graph)
    analyzer_config = convert_graph_to_es_analyzer(graph_data)
    return {
        "analysis": {
            "analyzer": {
                f"custom_{project.name.lower().replace(' ', '_')}": analyzer_config
            }
        }
    }