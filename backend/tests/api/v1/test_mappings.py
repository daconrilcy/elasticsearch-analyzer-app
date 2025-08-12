"""Tests pour les endpoints de validation DSL des mappings."""

import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import app


@pytest.mark.asyncio
async def test_validate_minimal(async_client):
    """Test de validation d'un mapping DSL minimal valide."""
    payload = {
        "index": "demo",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": [],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 10, "seed": 1}
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "fields": [
            {
                "target": "name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    response = await async_client.post("/api/v1/mappings/validate/test", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["errors"] == []
    assert result["warnings"] == []


@pytest.mark.asyncio
async def test_validate_with_errors(async_client):
    """Test de validation avec des erreurs."""
    payload = {
        "index": "demo",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": [],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 10, "seed": 1}
        },
        # id_policy manquant - devrait générer une erreur
        "fields": [
            {
                "target": "name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    response = await async_client.post("/api/v1/mappings/validate/test", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert len(result["errors"]) > 0
    # L'erreur JSON Schema indique qu'une propriété requise est manquante
    assert any("id_policy" in error["msg"] for error in result["errors"])


@pytest.mark.asyncio
async def test_compile_mapping(async_client):
    """Test de compilation d'un mapping DSL."""
    payload = {
        "index": "demo",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": [],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 10, "seed": 1}
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "fields": [
            {
                "target": "name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            },
            {
                "target": "age",
                "type": "long",
                "input": [{"kind": "column", "name": "user_age"}],
                "pipeline": []
            }
        ]
    }
    
    response = await async_client.post("/api/v1/mappings/compile/test", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert "settings" in result
    assert "mappings" in result
    assert "properties" in result["mappings"]
    assert "name" in result["mappings"]["properties"]
    assert "age" in result["mappings"]["properties"]


@pytest.mark.asyncio
async def test_compile_with_plan(async_client):
    """Test de compilation avec plan d'exécution."""
    payload = {
        "index": "demo",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": [],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 10, "seed": 1}
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "fields": [
            {
                "target": "name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    response = await async_client.post("/api/v1/mappings/compile/test?includePlan=true", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["execution_plan"] is not None
    assert len(result["execution_plan"]) == 1
    assert result["execution_plan"][0]["target"] == "name"


@pytest.mark.asyncio
async def test_dry_run_mapping(async_client):
    """Test de dry-run d'un mapping."""
    payload = {
        "index": "demo",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": [],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 10, "seed": 1}
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "fields": [
            {
                "target": "name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    response = await async_client.post("/api/v1/mappings/dry-run/test", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert "docs_preview" in result
    assert "issues" in result
