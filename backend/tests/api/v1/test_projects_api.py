import pytest
from httpx import AsyncClient
from fastapi import status

pytestmark = pytest.mark.asyncio


async def test_create_project(test_client: AsyncClient):
    """
    Teste la création d'un projet via l'endpoint POST /api/v1/projects/.
    """
    project_data = {
        "name": "Mon Premier Projet",
        "description": "Une description",
        "graph": {"nodes": [], "edges": []}
    }

    response = await test_client.post("/api/v1/projects/", json=project_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Mon Premier Projet"
    assert data["version"] == 1
    assert data["status"] == "draft"  # Le graphe est vide, donc il reste en brouillon
