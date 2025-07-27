"""app/domain/project/services.py"""

import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select as sa_select
from pydantic import BaseModel

from .models import Project
from .schemas import ProjectCreate, ProjectUpdate


async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Optional[Project]:
    """
    Récupère un projet par son ID.
    """
    return await db.get(Project, project_id)


async def get_all_projects(db: AsyncSession) -> List[Project]:
    """
    Récupère tous les projets (admin uniquement).
    """
    result = await db.execute(sa_select(Project))
    return result.scalars().all()


async def get_projects_by_owner(db: AsyncSession, owner_id: uuid.UUID) -> List[Project]:
    """
    Récupère tous les projets appartenant à un utilisateur.
    """
    result = await db.execute(
        sa_select(Project).where(Project.owner_id == str(owner_id))
    )
    return result.scalars().all()


async def create_project(
        db: AsyncSession, project_in: ProjectCreate, owner_id: uuid.UUID
) -> Project:
    """
    Crée un nouveau projet pour un utilisateur donné.
    """
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        graph=project_in.graph.model_dump(mode='json'),
        owner_id=str(owner_id)
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


async def update_project(
        db: AsyncSession, db_project: Project, project_in: ProjectUpdate
) -> Project:
    """
    Met à jour un projet existant.
    Incrémente la version si les champs 'graph' ou 'name' changent.
    """
    update_data = project_in.model_dump(exclude_unset=True)
    version_changed = any(
        key in update_data and getattr(db_project, key) != update_data[key]
        for key in ["name", "graph"]
    )

    for key, value in update_data.items():
        if key == "graph" and value is not None:
            if isinstance(value, BaseModel):
                value = value.model_dump(mode='json')
        setattr(db_project, key, value)

    if version_changed:
        db_project.version += 1

    await db.commit()
    await db.refresh(db_project)
    return db_project


async def delete_project(db: AsyncSession, project: Project) -> None:
    """
    Supprime un projet de la base de données.
    """
    await db.delete(project)
    await db.commit()
