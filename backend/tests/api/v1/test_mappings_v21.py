#!/usr/bin/env python3
"""Tests pour les fonctionnalités V2.1 du Mapping DSL."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_objectify_contacts():
    """Test de l'opération objectify pour créer des contacts structurés."""
    mapping = {
        "dsl_version": "2.1",
        "index": "users_v21",
        "globals": {
            "nulls": [], "bool_true": [], "bool_false": [], 
            "decimal_sep": ",", "thousands_sep": " ", 
            "date_formats": [], "default_tz": "Europe/Paris", 
            "empty_as_null": True
        },
        "id_policy": {
            "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
        },
        "containers": [{"path": "contacts[]", "type": "nested"}],
        "fields": [
            {
                "target": "contacts", 
                "type": "nested", 
                "input": [{"kind": "literal", "value": None}],
                "pipeline": [
                    {
                        "op": "objectify", 
                        "fields": {
                            "phone": {"kind": "jsonpath", "expr": "$.contacts[*].phone"},
                            "email": {"kind": "jsonpath", "expr": "$.contacts[*].email"}
                        },
                        "fill": None
                    }
                ]
            }
        ]
    }
    
    rows = [{"contacts": [{"phone": "01", "email": "a@x"}, {"phone": "02", "email": "b@x"}]}]
    
    response = client.post("/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    assert response.status_code == 200
    
    result = response.json()
    assert "docs_preview" in result
    assert len(result["docs_preview"]) > 0
    
    doc = result["docs_preview"][0]["_source"]
    assert "contacts" in doc
    assert len(doc["contacts"]) == 2
    assert doc["contacts"][1]["email"] == "b@x"
    assert doc["contacts"][1]["phone"] == "02"

def test_zip_then_objectify():
    """Test de l'opération zip suivie d'objectify."""
    mapping = {
        "dsl_version": "2.1",
        "index": "users_v21",
        "globals": {
            "nulls": [], "bool_true": [], "bool_false": [], 
            "decimal_sep": ",", "thousands_sep": " ", 
            "date_formats": [], "default_tz": "Europe/Paris", 
            "empty_as_null": True
        },
        "id_policy": {
            "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
        },
        "containers": [{"path": "pairs[]", "type": "nested"}],
        "fields": [
            {
                "target": "pairs", 
                "type": "nested",
                "input": [{"kind": "jsonpath", "expr": "$.a[*]"}],
                "pipeline": [
                    {"op": "zip", "with": [{"kind": "jsonpath", "expr": "$.b[*]"}]},
                    {
                        "op": "objectify", 
                        "fields": {
                            "left": {"kind": "literal", "value": None}, 
                            "right": {"kind": "literal", "value": None}
                        }
                    }
                ]
            }
        ]
    }
    
    rows = [{"a": [1, 2], "b": [10, 20]}]
    
    response = client.post("/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    assert response.status_code == 200
    
    result = response.json()
    assert "docs_preview" in result
    assert len(result["docs_preview"]) > 0
    
    doc = result["docs_preview"][0]["_source"]
    assert "pairs" in doc
    assert len(doc["pairs"]) == 2
    assert doc["pairs"][0]["left"] == 1
    assert doc["pairs"][0]["right"] == 10
    assert doc["pairs"][1]["left"] == 2
    assert doc["pairs"][1]["right"] == 20

def test_zip_multiple_arrays():
    """Test de l'opération zip avec plusieurs tableaux."""
    mapping = {
        "dsl_version": "2.1",
        "index": "test_v21",
        "globals": {
            "nulls": [], "bool_true": [], "bool_false": [], 
            "decimal_sep": ",", "thousands_sep": " ", 
            "date_formats": [], "default_tz": "Europe/Paris", 
            "empty_as_null": True
        },
        "id_policy": {
            "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
        },
        "fields": [
            {
                "target": "combined", 
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": "$.names[*]"}],
                "pipeline": [
                    {
                        "op": "zip", 
                        "with": [
                            {"kind": "jsonpath", "expr": "$.ages[*]"},
                            {"kind": "jsonpath", "expr": "$.cities[*]"}
                        ],
                        "fill": "unknown"
                    },
                    {"op": "join", "sep": " - "}
                ]
            }
        ]
    }
    
    rows = [{"names": ["Alice", "Bob"], "ages": [25, 30], "cities": ["Paris", "Lyon"]}]
    
    response = client.post("/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    assert response.status_code == 200
    
    result = response.json()
    assert "docs_preview" in result
    assert len(result["docs_preview"]) > 0
    
    doc = result["docs_preview"][0]["_source"]
    assert "combined" in doc
    # Le résultat devrait être une liste de chaînes jointes
    assert isinstance(doc["combined"], list)
    assert len(doc["combined"]) == 2

def test_cache_jsonpath_performance():
    """Test de la performance du cache JSONPath."""
    mapping = {
        "dsl_version": "2.1",
        "index": "perf_test",
        "globals": {
            "nulls": [], "bool_true": [], "bool_false": [], 
            "decimal_sep": ",", "thousands_sep": " ", 
            "date_formats": [], "default_tz": "Europe/Paris", 
            "empty_as_null": True
        },
        "id_policy": {
            "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
        },
        "fields": [
            {
                "target": "cached_result", 
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": "$.deeply.nested.array[*]"}],
                "pipeline": [
                    {"op": "length"},
                    {"op": "zip", "with": [{"kind": "jsonpath", "expr": "$.another.deep.path[*]"}]}
                ]
            }
        ]
    }
    
    # Données complexes pour tester le cache
    rows = [{
        "deeply": {"nested": {"array": ["a", "b", "c"]}},
        "another": {"deep": {"path": [1, 2, 3]}}
    }]
    
    response = client.post("/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    assert response.status_code == 200
    
    result = response.json()
    assert "docs_preview" in result
    assert len(result["docs_preview"]) > 0
    
    # Vérifier que le cache JSONPath est présent dans le mapping
    assert "__jp_cache__" in mapping
    assert len(mapping["__jp_cache__"]) > 0

