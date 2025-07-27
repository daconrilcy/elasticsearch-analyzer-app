# backend/tests/api/v1/test_projects.py

import pytest
import pytest_asyncio
from typing import Dict
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.user.schemas import UserCreate
from app.domain.user.services import user_service


# NOTE: Ce fichier ne contient plus aucune configuration de base de données.
# Il utilise les fixtures "async_client" et "db_session" de conftest.py.

@pytest_asyncio.fixture(scope="function")
async def auth_headers(async_client: AsyncClient, db_session: AsyncSession) -> Dict[str, str]:
    """
    Fixture asynchrone pour créer un utilisateur de test directement en base,
    puis se connecter via l'API pour obtenir un token JWT.
    """
    test_username = "testuser"
    test_email = "test@example.com"
    test_password = "testpassword"

    # Création directe de l'utilisateur en base pour la fiabilité des tests
    user = await user_service.get_by_username(db_session, username=test_username)
    if not user:
        user_in = UserCreate(username=test_username, email=test_email, password=test_password)
        await user_service.create(db_session, user_in=user_in)

    # Connexion via l'API pour obtenir le token
    login_data = {"username": test_username, "password": test_password}

    # --- CORRECTION 1: Utiliser `json=` car l'API attend du JSON pour le login ---
    response = await async_client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 200, f"La connexion a échoué: {response.text}"

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --- Tests (maintenant asynchrones et utilisant httpx.AsyncClient) ---

@pytest.mark.asyncio
async def test_create_project(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la création d'un projet (authentifié)."""
    # --- CORRECTION 2: Fournir un objet 'graph' valide avec 'nodes' et 'edges' ---
    project_data = {
        "name": "Nouveau Projet Test",
        "description": "Description du projet",
        "graph": {"nodes": [], "edges": []}
    }
    response = await async_client.post("/api/v1/projects/", headers=auth_headers, json=project_data)

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Nouveau Projet Test"
    assert "id" in data


@pytest.mark.asyncio
async def test_read_project(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la lecture d'un projet spécifique (authentifié)."""
    project_data = {"name": "Projet à Lire", "description": "Desc", "graph": {"nodes": [], "edges": []}}
    create_response = await async_client.post("/api/v1/projects/", headers=auth_headers, json=project_data)
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    read_response = await async_client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert read_response.status_code == 200, read_response.text
    data = read_response.json()
    assert data["name"] == "Projet à Lire"
    assert data["id"] == project_id


@pytest.mark.asyncio
async def test_read_project_not_found(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la lecture d'un projet qui n'existe pas."""
    response = await async_client.get("/api/v1/projects/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_read_projects(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la lecture de la liste des projets."""
    await async_client.post("/api/v1/projects/", headers=auth_headers,
                            json={"name": "Projet 1", "description": "D1", "graph": {"nodes": [], "edges": []}})
    await async_client.post("/api/v1/projects/", headers=auth_headers,
                            json={"name": "Projet 2", "description": "D2", "graph": {"nodes": [], "edges": []}})

    response = await async_client.get("/api/v1/projects/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_update_project(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la mise à jour d'un projet."""
    create_response = await async_client.post(
        "/api/v1/projects/", headers=auth_headers,
        json={"name": "Ancien Nom", "description": "Ancienne Desc", "graph": {"nodes": [], "edges": []}}
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    update_data = {"name": "Nouveau Nom Mis à Jour", "description": "Nouvelle Desc"}
    update_response = await async_client.put(f"/api/v1/projects/{project_id}", headers=auth_headers, json=update_data)
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["name"] == "Nouveau Nom Mis à Jour"


@pytest.mark.asyncio
async def test_delete_project(async_client: AsyncClient, auth_headers: Dict[str, str]):
    """Test de la suppression d'un projet."""
    create_response = await async_client.post(
        "/api/v1/projects/", headers=auth_headers,
        json={"name": "Projet à Supprimer", "description": "...", "graph": {"nodes": [], "edges": []}}
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    delete_response = await async_client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)

    # --- CORRECTION 3: Le code de succès pour DELETE est souvent 204 (No Content) ---
    assert delete_response.status_code == 204

    get_response = await async_client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_response.status_code == 404
