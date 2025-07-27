# backend/tests/conftest.py

import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Attention à l'import de 'app' pour qu'il soit trouvable par pytest
from main import app
from app.core.db import Base, get_db

# Utiliser une base de données SQLite en mémoire : rapide et isolée pour chaque test.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL)
test_async_session_maker = async_sessionmaker(
    bind=test_engine, expire_on_commit=False, class_=AsyncSession
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Fixture centrale pour la session de base de données.
    Crée toutes les tables avant chaque test et les supprime après.
    Garantit une isolation parfaite entre les tests.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session_maker() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture pour un client de test entièrement asynchrone (httpx.AsyncClient).
    Surcharge la dépendance get_db pour utiliser la session de test.
    """

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Utiliser le client asynchrone httpx
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    # Nettoie la surcharge après le test
    del app.dependency_overrides[get_db]
