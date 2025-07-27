import pytest
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String
from sqlalchemy import inspect
import pytest_asyncio

from app.domain.project.models import Project, ProjectStatus, get_json_type, get_uuid_type
from app.core.db import Base

DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="module")
async def async_session():
    engine = create_async_engine(DATABASE_URL, echo=False)
    TestSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_project_creation_defaults(async_session):
    project = Project(name="Test Project", graph={"nodes": [], "edges": []})
    async_session.add(project)
    await async_session.commit()

    result = await async_session.get(Project, project.id)
    assert result is not None
    assert result.name == "Test Project"
    assert result.version == 1
    assert result.status == ProjectStatus.DRAFT
    assert isinstance(result.id, uuid.UUID) or isinstance(result.id, str)
    assert isinstance(result.created_at, datetime)
    assert isinstance(result.updated_at, datetime)


def test_project_status_enum():
    assert ProjectStatus.DRAFT == "draft"
    assert ProjectStatus.VALIDATED == "validated"
    assert ProjectStatus.PUBLISHED == "published"


def test_get_uuid_type_sqlite():
    class Dummy:
        metadata = type("Meta", (),
                        {"bind": type("Bind", (), {"dialect": type("Dialect", (), {"name": "sqlite"})()})()})

    uuid_type = get_uuid_type(Dummy)
    assert str(uuid_type) == "VARCHAR(36)"


def test_get_json_type_sqlite():
    class Dummy:
        metadata = type("Meta", (),
                        {"bind": type("Bind", (), {"dialect": type("Dialect", (), {"name": "sqlite"})()})()})

    json_type = get_json_type(Dummy)
    assert "JSON" in str(json_type)


def test_sqlalchemy_columns_and_indexes():
    inspector = inspect(Project)
    column_names = [col.name for col in inspector.columns]
    assert "id" in column_names
    assert "name" in column_names
    assert "graph" in column_names
    assert "status" in column_names
    assert "version" in column_names
    assert "created_at" in column_names
    assert "updated_at" in column_names
