from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.app.core.db import get_db
from backend.app.domain.project.models import Project
from backend.app.domain.user.models import User
from backend.app.domain.project.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from backend.app.domain.analyzer.services import AnalyzerGraph
from backend.app.domain.analyzer.services import convert_graph_to_es_analyzer
from backend.app.api.v1.auth import get_current_user  # <— Importer la dépendance d'authentification

router = APIRouter()


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
        project_in: ProjectCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    """Crée un nouveau projet et l'associe à l'utilisateur courant."""
    graph_data_for_db = project_in.graph.model_dump(mode='json')

    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        graph=graph_data_for_db,
        user_id=current_user.id  # <-- Associer le projet à l'utilisateur
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


@router.get("/", response_model=List[ProjectOut])
async def get_user_projects(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    """Récupère la liste des projets de l'utilisateur courant."""
    query = select(Project).where(Project.user_id == current_user.id)
    result = await db.execute(query)
    projects = result.scalars().all()
    return projects


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    """Récupère un projet par son ID, en vérifiant qu'il appartient bien à l'utilisateur."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
        project_id: int,
        project_in: ProjectUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    """Met à jour un projet, en vérifiant d'abord l'appartenance."""
    db_project = await db.get(Project, project_id)
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    if db_project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")

    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)

    await db.commit()
    await db.refresh(db_project)
    return db_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    """Supprime un projet, en vérifiant d'abord l'appartenance."""
    project = await db.get(Project, project_id)
    if project and project.user_id == current_user.id:
        await db.delete(project)
        await db.commit()
    elif not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")
    return None


# La route d'export doit aussi être sécurisée
@router.get("/{project_id}/export")
async def export_project_config(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)  # <-- Sécuriser la route
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")

    # ... (logique d'export inchangée)
    graph_data = AnalyzerGraph.model_validate(project.graph)
    analyzer_config = convert_graph_to_es_analyzer(graph_data)
    # ...
    return {"analysis": {"analyzer": {f"custom_{project.name.lower().replace(' ', '_')}": analyzer_config}}}
