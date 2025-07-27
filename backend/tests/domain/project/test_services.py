"""tests/domain/project/test_services.py"""
import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.project.models import Project, ProjectStatus
from app.domain.project.schemas import ProjectCreate, ProjectUpdate
from app.domain.project.services import (
    create_project,
    get_project,
    get_all_projects,
    update_project,
    delete_project,
)


@pytest.mark.asyncio
async def test_create_project(db_session: AsyncSession, fake_graph):
    data = ProjectCreate(name="Test Project", description="Test Desc", graph=fake_graph)

    project = await create_project(db_session, data)

    assert isinstance(project, Project)
    assert project.name == data.name
    assert project.description == data.description
    assert isinstance(project.graph, dict)
    assert project.version == 1
    assert project.status == ProjectStatus.DRAFT


@pytest.mark.asyncio
async def test_get_project(db_session: AsyncSession, fake_graph):
    data = ProjectCreate(name="ToRetrieve", description="To find", graph=fake_graph)
    created = await create_project(db_session, data)

    fetched = await get_project(db_session, created.id)

    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.name == created.name


@pytest.mark.asyncio
async def test_get_project_not_found(db_session: AsyncSession):
    unknown_id = str(uuid4())
    result = await get_project(db_session, unknown_id)
    assert result is None


@pytest.mark.asyncio
async def test_get_all_projects(db_session: AsyncSession, fake_graph):
    await create_project(db_session, ProjectCreate(name="P1", description="D1", graph=fake_graph))
    await create_project(db_session, ProjectCreate(name="P2", description="D2", graph=fake_graph))

    projects = await get_all_projects(db_session)

    assert isinstance(projects, list)
    assert len(projects) >= 2
    assert all(isinstance(p, Project) for p in projects)


@pytest.mark.asyncio
async def test_update_project_increments_version(db_session: AsyncSession, fake_graph):
    project = await create_project(db_session, ProjectCreate(name="Old", description="Old desc", graph=fake_graph))
    update = ProjectUpdate(name="Updated", graph=fake_graph)

    updated = await update_project(db_session, project, update)

    assert updated.name == "Updated"
    assert updated.version == 2


@pytest.mark.asyncio
async def test_update_project_status_only(db_session: AsyncSession, fake_graph):
    project = await create_project(db_session, ProjectCreate(name="KeepName", graph=fake_graph))
    update = ProjectUpdate(status=ProjectStatus.VALIDATED)

    updated = await update_project(db_session, project, update)

    assert updated.status == ProjectStatus.VALIDATED
    assert updated.version == 1  # no version bump


@pytest.mark.asyncio
async def test_delete_project(db_session: AsyncSession, fake_graph):
    project = await create_project(db_session, ProjectCreate(name="ToDelete", graph=fake_graph))

    await delete_project(db_session, project)

    deleted = await get_project(db_session, project.id)
    assert deleted is None
