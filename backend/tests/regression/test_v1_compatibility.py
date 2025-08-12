#!/usr/bin/env python3
"""Tests de régression pour la compatibilité V1."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestV1Compatibility:
    """Tests de régression pour s'assurer que la V1 continue de fonctionner."""
    
    def test_v1_basic_mapping(self):
        """Test basique de mapping V1."""
        mapping = {
            "dsl_version": "1.0",
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
                },
                {
                    "target": "age",
                    "type": "long",
                    "input": [
                        {
                            "kind": "column",
                            "name": "age"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "cast",
                            "to": "long"
                        }
                    ]
                }
            ]
        }
        
        rows = [
            {"name": "  John  ", "age": "25"},
            {"name": "  Jane  ", "age": "30"}
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["docs_preview"]) == 2
        
        # Vérifier le premier document
        doc1 = result["docs_preview"][0]["_source"]
        assert doc1["name"] == "John"
        assert doc1["age"] == 25
        
        # Vérifier le deuxième document
        doc2 = result["docs_preview"][1]["_source"]
        assert doc2["name"] == "Jane"
        assert doc2["age"] == 30
    
    def test_v1_validation(self):
        """Test de validation V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
                    "target": "field1",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "column",
                            "name": "field1"
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
    
    def test_v1_compilation(self):
        """Test de compilation V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
                    "target": "field1",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "column",
                            "name": "field1"
                        }
                    ],
                    "pipeline": []
                },
                {
                    "target": "nested.field2",
                    "type": "text",
                    "input": [
                        {
                            "kind": "column",
                            "name": "field2"
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
        
        # Vérifier la structure générée
        assert "field1" in mappings
        assert mappings["field1"]["type"] == "keyword"
        
        assert "nested" in mappings
        assert "field2" in mappings["nested"]["properties"]
        assert mappings["nested"]["properties"]["field2"]["type"] == "text"
    
    def test_v1_operations(self):
        """Test des opérations V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
                    "target": "processed",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "column",
                            "name": "raw"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "trim"
                        },
                        {
                            "op": "lowercase"
                        },
                        {
                            "op": "replace",
                            "pattern": "\\s+",
                            "replacement": "_"
                        }
                    ]
                }
            ]
        }
        
        rows = [
            {"raw": "  Hello World  "},
            {"raw": "  Test String  "}
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["docs_preview"]) == 2
        
        # Vérifier le traitement
        doc1 = result["docs_preview"][0]["_source"]
        assert doc1["processed"] == "hello_world"
        
        doc2 = result["docs_preview"][1]["_source"]
        assert doc2["processed"] == "test_string"
    
    def test_v1_multi_fields(self):
        """Test des multi-fields V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
                    "target": "title",
                    "type": "text",
                    "input": [
                        {
                            "kind": "column",
                            "name": "title"
                        }
                    ],
                    "pipeline": [],
                    "multi_fields": [
                        {
                            "name": "keyword",
                            "type": "keyword"
                        },
                        {
                            "name": "search",
                            "type": "text",
                            "analyzer": "standard"
                        }
                    ]
                }
            ]
        }
        
        response = client.post("/mappings/compile", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        mappings = result["mappings"]["properties"]
        
        assert "title" in mappings
        assert mappings["title"]["type"] == "text"
        assert "fields" in mappings["title"]
        
        # Vérifier les multi-fields
        fields = mappings["title"]["fields"]
        assert "keyword" in fields
        assert fields["keyword"]["type"] == "keyword"
        assert "search" in fields
        assert fields["search"]["type"] == "text"
        assert fields["search"]["analyzer"] == "standard"
    
    def test_v1_id_generation(self):
        """Test de génération d'ID V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
                "from": ["id", "type"],
                "op": "concat",
                "sep": "_",
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
                    "pipeline": []
                }
            ]
        }
        
        rows = [
            {"id": "user1", "type": "admin", "name": "John"},
            {"id": "user2", "type": "user", "name": "Jane"}
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["docs_preview"]) == 2
        
        # Vérifier les IDs générés
        doc1 = result["docs_preview"][0]
        assert doc1["_id"] == "user1_admin"
        
        doc2 = result["docs_preview"][1]
        assert doc2["_id"] == "user2_user"
    
    def test_v1_dictionary_lookup(self):
        """Test de lookup de dictionnaire V1."""
        mapping = {
            "dsl_version": "1.0",
            "index": "test_v1",
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
            "dictionaries": {
                "status_map": {
                    "A": "Active",
                    "I": "Inactive",
                    "P": "Pending"
                }
            },
            "fields": [
                {
                    "target": "status_label",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "column",
                            "name": "status"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "dict",
                            "dictionary": "status_map"
                        }
                    ]
                }
            ]
        }
        
        rows = [
            {"status": "A"},
            {"status": "I"},
            {"status": "P"}
        ]
        
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["docs_preview"]) == 3
        
        # Vérifier les traductions
        doc1 = result["docs_preview"][0]["_source"]
        assert doc1["status_label"] == "Active"
        
        doc2 = result["docs_preview"][1]["_source"]
        assert doc2["status_label"] == "Inactive"
        
        doc3 = result["docs_preview"][2]["_source"]
        assert doc3["status_label"] == "Pending"
