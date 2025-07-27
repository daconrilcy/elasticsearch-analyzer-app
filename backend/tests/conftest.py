"""tests/conftest.py"""

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.main import app
from app.core.db import get_db, Base
from app.domain.analyzer.models import AnalyzerGraph
from uuid import uuid4
from fastapi.testclient import TestClient
import pytest_asyncio

# Base de données SQLite en mémoire pour les tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Sessionmaker dédié aux tests
test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
test_async_session_maker = async_sessionmaker(
    bind=test_engine, expire_on_commit=False, class_=AsyncSession
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Fixture pour fournir une session de BDD de test (transactionnelle, isolation complète)."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session_maker() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def test_client(db_session):
    """Fixture pour le client HTTP sync de test (compatible FastAPI >=0.116)."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client


@pytest.fixture
def fake_graph():
    """Fixture pour générer un graphe d'analyseur valide compatible Pydantic v2."""
    return AnalyzerGraph(
        id=str(uuid4()),
        name="TestGraph",
        version="1",
        settings={},
        nodes=[],
        edges=[]
    )
