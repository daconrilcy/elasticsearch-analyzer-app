"""Tests pour les fonctionnalités de hardening des mappings."""
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_check_ids():
    """Test de l'endpoint check-ids avec détection de collisions."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/mappings/check-ids/test",
            json={
                "mapping": {
                    "id_policy": {
                        "source": "id",
                        "from": ["id"],
                        "op": "concat",
                        "sep": ":",
                        "on_conflict": "overwrite"
                    }
                },
                "sample": {
                    "rows": [
                        {"id": "1"},
                        {"id": "1"},  # Doublon
                        {"id": "2"}
                    ]
                }
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["duplicates"] == 1
    assert data["duplicate_rate"] == 0.3333333333333333
    assert len(data["samples"]) == 1
    assert data["samples"][0]["_id"] == "1"


@pytest.mark.asyncio
async def test_dsl_version_required():
    """Test que dsl_version est requis dans le schéma."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/mappings/validate/test",
            json={
                "index": "test",
                "globals": {
                    "nulls": [""],
                    "bool_true": ["true"],
                    "bool_false": ["false"],
                    "decimal_sep": ".",
                    "thousands_sep": ",",
                    "date_formats": ["yyyy-MM-dd"],
                    "default_tz": "UTC",
                    "empty_as_null": True,
                    "preview": {"sample_size": 100}
                },
                "id_policy": {
                    "from": ["id"],
                    "op": "concat",
                    "sep": ":",
                    "on_conflict": "overwrite"
                },
                "fields": [
                    {
                        "target": "id",
                        "type": "keyword",
                        "input": [{"kind": "column", "name": "id"}],
                        "pipeline": []
                    }
                ]
                # dsl_version manquant
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["errors"]) > 0
    # Vérifier que l'erreur dsl_version est présente
    dsl_errors = [e for e in data["errors"] if "dsl_version" in e["msg"]]
    assert len(dsl_errors) > 0


@pytest.mark.asyncio
async def test_compiled_hash_generation():
    """Test que compiled_hash est généré lors de la compilation."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/mappings/compile/test",
            json={
                "dsl_version": "1.0",
                "index": "test",
                "globals": {
                    "nulls": [""],
                    "bool_true": ["true"],
                    "bool_false": ["false"],
                    "decimal_sep": ".",
                    "thousands_sep": ",",
                    "date_formats": ["yyyy-MM-dd"],
                    "default_tz": "UTC",
                    "empty_as_null": True,
                    "preview": {"sample_size": 100}
                },
                "id_policy": {
                    "from": ["id"],
                    "op": "concat",
                    "sep": ":",
                    "on_conflict": "overwrite"
                },
                "fields": [
                    {
                        "target": "id",
                        "type": "keyword",
                        "input": [{"kind": "column", "name": "id"}],
                        "pipeline": []
                    }
                ]
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "compiled_hash" in data
    assert isinstance(data["compiled_hash"], str)
    assert len(data["compiled_hash"]) == 64  # SHA256 hex
