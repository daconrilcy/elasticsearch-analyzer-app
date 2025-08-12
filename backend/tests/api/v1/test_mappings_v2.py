#!/usr/bin/env python3
"""Tests pour la V2 du système de mapping avec containers et ops array-aware."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestMappingV2:
    """Tests pour les fonctionnalités V2 du mapping."""
    
    def test_jsonpath_map_nested(self):
        """Test JSONPath + map + nested containers."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": ["yyyy-MM-dd"],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "contacts.phone",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*].phone"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "trim"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        rows = [
            {
                "contacts": [
                    {"phone": " 01 "},
                    {"phone": "02"}
                ]
            }
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        assert "docs_preview" in result
        assert len(result["docs_preview"]) == 1
        
        doc = result["docs_preview"][0]["_source"]
        assert "contacts" in doc
        assert isinstance(doc["contacts"], list)
        assert len(doc["contacts"]) == 2
        assert doc["contacts"][0]["phone"] == "01"
        assert doc["contacts"][1]["phone"] == "02"
    
    def test_take_and_join(self):
        """Test des opérations take et join avec JSONPath."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "tags_first",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.tags[*]"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "take",
                            "which": "first"
                        }
                    ]
                },
                {
                    "target": "tags_joined",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.tags[*]"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "join",
                            "sep": "|"
                        }
                    ]
                }
            ]
        }
        
        rows = [{"tags": ["foo", "bar", "baz"]}]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        doc = result["docs_preview"][0]["_source"]
        
        assert doc["tags_first"] == "foo"
        assert doc["tags_joined"] == "foo|bar|baz"
    
    def test_flatten(self):
        """Test de l'opération flatten."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "flat",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "literal",
                            "value": [[1, 2], [3]]
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "flatten"
                        },
                        {
                            "op": "join",
                            "sep": ","
                        }
                    ]
                }
            ]
        }
        
        rows = [{}]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        doc = result["docs_preview"][0]["_source"]
        
        assert doc["flat"] == "1,2,3"
    
    def test_compile_containers(self):
        """Test de la compilation des containers."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "contacts.phone",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "literal",
                            "value": "01"
                        }
                    ],
                    "pipeline": []
                }
            ]
        }
        
        response = client.post("/mappings/compile", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        mappings = result["mappings"]["properties"]
        
        assert "contacts" in mappings
        assert mappings["contacts"]["type"] == "nested"
        assert "phone" in mappings["contacts"]["properties"]
    
    def test_mixed_containers(self):
        """Test de containers mixtes (nested + object)."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                },
                {
                    "path": "address",
                    "type": "object"
                }
            ],
            "fields": [
                {
                    "target": "contacts.phone",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*].phone"
                        }
                    ],
                    "pipeline": []
                },
                {
                    "target": "address.city",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "literal",
                            "value": "Paris"
                        }
                    ],
                    "pipeline": []
                }
            ]
        }
        
        rows = [
            {
                "contacts": [
                    {"phone": "01"},
                    {"phone": "02"}
                ]
            }
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        doc = result["docs_preview"][0]["_source"]
        
        # Vérifier contacts nested
        assert "contacts" in doc
        assert isinstance(doc["contacts"], list)
        assert len(doc["contacts"]) == 2
        
        # Vérifier address object
        assert "address" in doc
        assert isinstance(doc["address"], dict)
        assert doc["address"]["city"] == "Paris"
    
    def test_complex_pipeline(self):
        """Test d'un pipeline complexe avec map et conditions."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "scores[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "scores.value",
                    "type": "long",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.scores[*].value"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "when",
                                    "cond": {"gt": 50},
                                    "then": [
                                        {
                                            "op": "cast",
                                            "to": "long"
                                        }
                                    ],
                                    "else": [
                                        {
                                            "op": "literal",
                                            "value": 0
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        rows = [
            {
                "scores": [
                    {"value": "75"},
                    {"value": "25"},
                    {"value": "90"}
                ]
            }
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        doc = result["docs_preview"][0]["_source"]
        
        assert "scores" in doc
        assert isinstance(doc["scores"], list)
        assert len(doc["scores"]) == 3
        
        # Vérifier que les valeurs > 50 sont conservées, les autres mises à 0
        scores = [s["value"] for s in doc["scores"]]
        assert 75 in scores
        assert 0 in scores
        assert 90 in scores
    
    def test_backward_compatibility_v1(self):
        """Test de la rétrocompatibilité avec V1."""
        mapping = {
            "dsl_version": "1.0",  # Version V1
            "index": "users_v1",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
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
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "column",
                            "name": "name"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "trim"
                        }
                    ]
                }
            ]
        }
        
        rows = [{"name": "  John  "}]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        doc = result["docs_preview"][0]["_source"]
        
        assert doc["name"] == "John"
    
    def test_validation_v2_schema(self):
        """Test de validation du schéma V2."""
        mapping = {
            "dsl_version": "2.0",
            "index": "users_v2",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "contacts.phone",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*].phone"
                        }
                    ],
                    "pipeline": []
                }
            ]
        }
        
        response = client.post("/mappings/validate", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        assert result["valid"] == True
        assert len(result["errors"]) == 0
