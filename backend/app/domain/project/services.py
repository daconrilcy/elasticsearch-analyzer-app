# app/domain/project/services.py
import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import Project
from .schemas import ProjectCreate, ProjectUpdate


async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Optional[Project]:  # CORRECTION: int -> uuid.UUID
    """Récupère un projet par son ID."""
    return await db.get(Project, project_id)


async def get_all_projects(db: AsyncSession) -> List[Project]:
    """Récupère tous les projets."""
    result = await db.execute(select(Project))
    return result.scalars().all()


async def create_project(db: AsyncSession, project_in: ProjectCreate) -> Project:
    """Crée un nouveau projet."""
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


async def update_project(db: AsyncSession, db_project: Project, project_in: ProjectUpdate) -> Project:
    """Met à jour un projet et incrémente sa version si nécessaire."""
    update_data = project_in.model_dump(exclude_unset=True)
    version_changed = False
    for key, value in update_data.items():
        if key in ["graph", "name"] and getattr(db_project, key) != value:
            version_changed = True
        if key == "graph" and project_in.graph:
            setattr(db_project, key, project_in.graph.model_dump(mode='json'))
        else:
            setattr(db_project, key, value)
    if version_changed:
        db_project.version += 1
    await db.commit()
    await db.refresh(db_project)
    return db_project


async def delete_project(db: AsyncSession, project: Project) -> None:
    """Supprime un projet."""
    await db.delete(project)
    await db.commit()
