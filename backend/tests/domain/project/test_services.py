import pytest
from unittest.mock import AsyncMock

from backend.app.domain.project import services, schemas, models
from backend.app.domain.analyzer.models import AnalyzerGraph

# Marqueur pour indiquer que tous les tests de ce fichier sont asynchrones
pytestmark = pytest.mark.asyncio


async def test_update_project_increments_version_on_graph_change():
    """
    Vérifie que la version est incrémentée quand le graphe change.
    """
    # 1. Préparation (Arrange)
    db_session_mock = AsyncMock()

    # Création d'un projet existant factice
    initial_graph = AnalyzerGraph(nodes=[], edges=[])
    db_project = models.Project(id=1, name="Test Project", version=1, graph={})

    # Création des données de mise à jour avec un graphe différent
    updated_graph = AnalyzerGraph(nodes=[{"id": "1", "kind": "input", "name": "input"}], edges=[])
    project_in = schemas.ProjectUpdate(graph=updated_graph)

    # 2. Action (Act)
    updated_project = await services.update_project(
        db=db_session_mock,
        db_project=db_project,
        project_in=project_in
    )

    # 3. Vérification (Assert)
    assert updated_project.version == 2
    assert db_session_mock.commit.called_once