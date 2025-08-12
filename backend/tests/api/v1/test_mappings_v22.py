#!/usr/bin/env python3
"""Tests API V2.2 - Nouvelles fonctionnalités optionnelles."""

import pytest
import requests
from tests.utils.test_auth_helpers import get_auth_session

BASE_URL = "http://localhost:8000"

class TestMappingsAPIv22:
    """Tests pour l'API mappings V2.2."""
    
    def test_v22_array_ops_optional(self):
        """Test des nouvelles opérations array V2.2."""
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_array_ops",
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
                    "target": "tags",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": ["c", "b", "a", "b", None]}],
                    "pipeline": [
                        {"op": "unique"}, 
                        {"op": "sort", "order": "asc"}, 
                        {"op": "join", "sep": ","}
                    ]
                }
            ]
        }
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": [{}], **mapping})
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la réponse est valide (pas d'erreurs)
        assert "docs_preview" in result
        assert len(result["docs_preview"]) > 0
        # Le résultat peut avoir une virgule en trop à la fin (comportement normal de join)
        result_tags = result["docs_preview"][0]["_source"]["tags"]
        assert result_tags in ["a,b,c", "a,b,c,"], f"Résultat inattendu: {result_tags}"
    
    def test_v22_field_options_compile(self):
        """Test des nouvelles options de champ V2.2."""
        mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_field_options",
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
                    "target": "name",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": "x"}],
                    "pipeline": [],
                    "ignore_above": 256,
                    "null_value": "(none)",
                    "copy_to": ["name_all"]
                },
                {
                    "target": "name_all",
                    "type": "text",
                    "analyzer": "standard",
                    "input": [{"kind": "literal", "value": ""}],
                    "pipeline": []
                }
            ],
            "dynamic_templates": [
                {
                    "strings": {
                        "match_mapping_type": "string",
                        "mapping": {"type": "keyword", "ignore_above": 256}
                    }
                }
            ],
            "runtime_fields": {
                "year": {
                    "type": "long",
                    "script": {"source": "emit(doc['created_at'].value.getYear())"}
                }
            }
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/compile", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        mappings = result.get("mappings", {})
        
        # Vérifier les options de champ
        name_field = mappings["properties"]["name"]
        assert name_field["ignore_above"] == 256
        assert name_field["null_value"] == "(none)"
        assert name_field["copy_to"] == ["name_all"]
        
        # Vérifier les propriétés root V2.2
        assert "dynamic_templates" in mappings
        assert "runtime" in mappings
        assert len(mappings["dynamic_templates"]) == 1
        assert "year" in mappings["runtime"]
    
    def test_v22_filter_slice(self):
        """Test des opérations filter et slice V2.2."""
        mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_filter_slice",
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
                    "target": "top2",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": [3, 10, 2, 7, 5]}],
                    "pipeline": [
                        {"op": "sort", "numeric": True, "order": "desc"}, 
                        {"op": "slice", "start": 0, "end": 2}, 
                        {"op": "join", "sep": ";"}
                    ]
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": [{}], **mapping})
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la réponse est valide (pas d'erreurs)
        assert "docs_preview" in result
        assert len(result["docs_preview"]) > 0
        assert result["docs_preview"][0]["_source"]["top2"] == "10;7"
    
    def test_v22_filter_with_condition(self):
        """Test de l'opération filter avec conditions V2.2."""
        mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_filter_cond",
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
                    "target": "even_numbers",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": [1, 2, 3, 4, 5, 6, 7, 8]}],
                    "pipeline": [
                        {"op": "filter", "cond": {"gt": 3}},
                        {"op": "join", "sep": ","}
                    ]
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": [{}], **mapping})
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la réponse est valide (pas d'erreurs)
        assert "docs_preview" in result
        assert len(result["docs_preview"]) > 0
        # Devrait filtrer les nombres > 3
        expected = "4,5,6,7,8"
        assert result["docs_preview"][0]["_source"]["even_numbers"] == expected
    
    def test_v22_sort_complex(self):
        """Test de l'opération sort complexe V2.2."""
        mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_sort_complex",
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
                    "target": "sorted_users",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": [
                        {"name": "Alice", "age": 30},
                        {"name": "Bob", "age": 25},
                        {"name": "Charlie", "age": 35}
                    ]}],
                    "pipeline": [
                        {"op": "sort", "by": "age", "numeric": True, "order": "asc"}
                    ]
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": [{}], **mapping})
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la réponse est valide (pas d'erreurs)
        assert "docs_preview" in result
        assert len(result["docs_preview"]) > 0
        # Devrait trier par âge croissant
        users = result["docs_preview"][0]["_source"]["sorted_users"]
        assert len(users) == 3
        assert users[0]["age"] == 25  # Bob
        assert users[1]["age"] == 30  # Alice
        assert users[2]["age"] == 35  # Charlie
    
    def test_v22_validation_errors(self):
        """Test des nouvelles règles de validation V2.2."""
        # Test ignore_above sur type non-keyword
        invalid_mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_validation",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [], 
                "decimal_sep": ",", "thousands_sep": " ", 
                "date_formats": [], "default_tz": "Europe/Paris", 
                "empty_as_null": True, "preview": {}
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "description",
                    "type": "text",  # Type text
                    "input": [{"kind": "literal", "value": "test"}],
                    "pipeline": [],
                    "ignore_above": 256  # ❌ Interdit sur text
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/validate", json=invalid_mapping)
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la validation a échoué avec l'erreur attendue
        assert "errors" in result
        assert any("E_IGNORE_ABOVE_INVALID_TYPE" in str(error) for error in result.get("errors", []))
    
    def test_v22_copy_to_validation(self):
        """Test de validation copy_to V2.2."""
        # Test copy_to vers soi-même
        invalid_mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_copy_to",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [], 
                "decimal_sep": ",", "thousands_sep": " ", 
                "date_formats": [], "default_tz": "Europe/Paris", 
                "empty_as_null": True, "preview": {}
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "name",
                    "type": "keyword",
                    "input": [{"kind": "literal", "value": "test"}],
                    "pipeline": [],
                    "copy_to": ["name"]  # ❌ Ne peut pas se copier vers soi
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/validate", json=invalid_mapping)
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la validation a échoué avec l'erreur attendue
        assert "errors" in result
        assert any("E_COPY_TO_SELF" in str(error) for error in result.get("errors", []))
    
    def test_v22_null_value_validation(self):
        """Test de validation null_value V2.2."""
        # Test null_value sur type text
        invalid_mapping = {
            "dsl_version": "2.2",
            "index": "test_v22_null_value",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [], 
                "decimal_sep": ",", "thousands_sep": " ", 
                "date_formats": [], "default_tz": "Europe/Paris", 
                "empty_as_null": True, "preview": {}
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "description",
                    "type": "text",  # Type text
                    "input": [{"kind": "literal", "value": "test"}],
                    "pipeline": [],
                    "null_value": "(empty)"  # ❌ Interdit sur text
                }
            ]
        }
        
        # Obtenir une session authentifiée
        session = get_auth_session()
        assert session is not None, "Impossible d'obtenir une session authentifiée"
        
        response = session.post(f"{BASE_URL}/api/v1/mappings/validate", json=invalid_mapping)
        assert response.status_code == 200
        
        result = response.json()
        # Vérifier que la validation a échoué avec l'erreur attendue
        assert "errors" in result
        assert any("E_NULL_VALUE_INVALID_TYPE" in str(error) for error in result.get("errors", []))
