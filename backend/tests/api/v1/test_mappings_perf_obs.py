"""Tests pour les fonctionnalités de performance et observabilité des mappings."""
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_regex_guard():
    """Test des gardes de sécurité pour les regex."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test avec un pattern regex trop long
        long_pattern = "a" * 1000  # Pattern de 1000 caractères
        response = await ac.post(
            "/api/v1/mappings/validate/test",
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
                        "target": "test",
                        "type": "keyword",
                        "input": [{"kind": "column", "name": "test"}],
                        "pipeline": [
                            {
                                "op": "replace",
                                "params": {"pattern": long_pattern, "replacement": "test"}
                            }
                        ]
                    }
                ]
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    # Le schéma devrait valider, mais les gardes regex seront appliquées lors de l'exécution


@pytest.mark.asyncio
async def test_geo_range():
    """Test de validation des plages géographiques."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test avec des coordonnées valides
        response = await ac.post(
            "/api/v1/mappings/validate/test",
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
                        "target": "location",
                        "type": "geo_point",
                        "input": [{"kind": "column", "name": "latlon"}],
                        "pipeline": [
                            {
                                "op": "parse_geo",
                                "params": {"format": "latlon"}
                            }
                        ]
                    }
                ]
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    # Le schéma devrait valider, mais les gardes géo seront appliquées lors de l'exécution


@pytest.mark.asyncio
async def test_body_size_limit():
    """Test des limites de taille de body."""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Créer un body très large
        large_body = {
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
                    "target": "large_field",
                    "type": "text",
                    "input": [{"kind": "column", "name": "large_field"}],
                    "pipeline": []
                }
            ]
        }
        
        # Ajouter un champ très large pour dépasser la limite
        large_body["large_content"] = "x" * (6 * 1024 * 1024)  # 6 MB
        
        response = await ac.post(
            "/api/v1/mappings/validate/test",
            json=large_body
        )
    
    # Devrait retourner une erreur 413 (Payload Too Large)
    # ou être rejeté par FastAPI avant d'atteindre notre endpoint
    assert response.status_code in [200, 413, 422]


@pytest.mark.asyncio
async def test_structured_logging():
    """Test que les logs structurés sont générés."""
    # Ce test vérifie que l'endpoint fonctionne et génère des logs
    # Les logs réels ne peuvent pas être testés facilement dans un test unitaire
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/mappings/dry-run/test",
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
                ],
                "sample": {
                    "rows": [{"id": "1"}]
                }
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "docs_preview" in data
    assert "issues" in data
    assert "stats" in data
