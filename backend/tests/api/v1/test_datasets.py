# tests/test_services.py

import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock
from app.domain.project.models import Project
from app.domain.project.schemas import ProjectCreate, ProjectUpdate
from app.domain.project.services import (
    create_project,
    get_project,
    get_all_projects,
    update_project,
    delete_project,
)
from app.domain.analyzer.models import AnalyzerGraph


def make_fake_graph() -> AnalyzerGraph:
    """Crée une instance valide simulée de AnalyzerGraph."""
    return AnalyzerGraph(
        id=uuid4(),
        name="FakeGraph",
        version=1,
        settings={},
        nodes=[],
        edges=[]
    )


@pytest.mark.asyncio
async def test_create_project():
    class FakeDB:
        def __init__(self):
            self.add = lambda obj: None  # méthode strictement synchrone
            self.commit = AsyncMock()
            self.refresh = AsyncMock()

    db = FakeDB()
    project_data = ProjectCreate(name="Test", description="Desc", graph=make_fake_graph())

    project = await create_project(db, project_data)

    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(project)


@pytest.mark.asyncio
async def test_get_project():
    db = AsyncMock()
    project_id = uuid4()

    await get_project(db, project_id)

    db.get.assert_awaited_once_with(Project, project_id)


@pytest.mark.asyncio
async def test_get_all_projects():
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = ["project1", "project2"]
    db.execute.return_value = mock_result

    projects = await get_all_projects(db)

    assert projects == ["project1", "project2"]
    db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_project():
    db = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    db_project = Project(id=uuid4(), name="Old", description="Old desc", graph={}, version=1)
    update_data = ProjectUpdate(name="New", graph=make_fake_graph())

    updated = await update_project(db, db_project, update_data)

    assert updated.name == "New"
    assert updated.version == 2
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(db_project)


@pytest.mark.asyncio
async def test_delete_project():
    db = MagicMock()
    db.delete = AsyncMock()
    db.commit = AsyncMock()
    project = MagicMock()

    await delete_project(db, project)

    db.delete.assert_awaited_once_with(project)
    db.commit.assert_awaited_once()
