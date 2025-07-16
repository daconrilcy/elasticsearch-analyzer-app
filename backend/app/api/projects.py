from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectOut

router = APIRouter()

@router.post("/api/v1/projects", response_model=ProjectOut)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    new_project = Project(**project.model_dump())
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project
