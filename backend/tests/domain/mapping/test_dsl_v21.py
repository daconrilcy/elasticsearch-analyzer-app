#!/usr/bin/env python3
"""Tests DSL V2.1 - Validation et compilation."""

import pytest
from app.domain.mapping.services import MappingService
from app.domain.mapping.validators.common.json_validator import validate_mapping

class TestDSLV21:
    """Tests pour le DSL V2.1."""
    
    def test_v21_validation_basic(self):
        """Test validation basique V2.1."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_basic",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [], 
                "decimal_sep": ",", "thousands_sep": " ", 
                "date_formats": [], "default_tz": "Europe/Paris", 
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "containers": [
                {"path": "profile[]", "type": "nested"},
                {"path": "address", "type": "object"}
            ],
            "fields": [
                {
                    "target": "name",
                    "type": "keyword",
                    "input": [{"kind": "jsonpath", "expr": "$.name"}],
                    "pipeline": [{"op": "trim"}]
                }
            ]
        }
        
        result, errors = validate_mapping(mapping)
        assert result is True, f"Validation échouée: {errors}"
    
    def test_v21_compilation_containers(self):
        """Test compilation V2.1 avec containers."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_compile",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [], 
                "decimal_sep": ",", "thousands_sep": " ", 
                "date_formats": [], "default_tz": "Europe/Paris", 
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "containers": [
                {"path": "profile[]", "type": "nested"}
            ],
            "fields": [
                {
                    "target": "profile.skill",
                    "type": "keyword",
                    "input": [{"kind": "jsonpath", "expr": "$.skills[*]"}]
                }
            ]
        }
        
        service = MappingService()
        result = service.compile(mapping)
        
        assert "mappings" in result
        assert "properties" in result["mappings"]
        assert "profile" in result["mappings"]["properties"]
        assert result["mappings"]["properties"]["profile"]["type"] == "nested"
    
    def test_v21_ilm_ingest_generation(self):
        """Test génération automatique ILM et Ingest Pipeline."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_ilm_ingest",
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
                    "input": [{"kind": "jsonpath", "expr": "$.name"}]
                }
            ]
        }
        
        service = MappingService()
        result = service.compile(mapping)
        
        # Vérifier la génération ILM
        assert "ilm_policy" in result
        assert "name" in result["ilm_policy"]
        assert result["ilm_policy"]["name"] == "test_v21_ilm_ingest_ilm_v1"
        
        # Vérifier la génération Ingest Pipeline
        assert "ingest_pipeline" in result
        assert "name" in result["ingest_pipeline"]
        assert result["ingest_pipeline"]["name"] == "test_v21_ilm_ingest_ingest_v1"
    
    def test_v21_jsonpath_input(self):
        """Test inputs JSONPath V2.1."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_jsonpath",
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
                    "target": "skills",
                    "type": "keyword",
                    "input": [{"kind": "jsonpath", "expr": "$.skills[*]"}]
                }
            ]
        }
        
        result, errors = validate_mapping(mapping)
        assert result is True, f"Validation échouée: {errors}"
    
    def test_v21_operations_enum(self):
        """Test que toutes les opérations V2.1 sont acceptées."""
        valid_ops = [
            "map", "take", "join", "flatten", "zip", "objectify",
            "trim", "lower", "upper", "split", "regex_replace",
            "date_parse", "geo_parse", "cast", "length", "literal", "regex_extract"
        ]
        
        for op in valid_ops:
            mapping = {
                "dsl_version": "2.1",
                "index": f"test_v21_op_{op}",
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
                        "target": "test",
                        "type": "keyword",
                        "input": [{"kind": "literal", "value": "test"}],
                        "pipeline": [{"op": op}]
                    }
                ]
            }
            
            result, errors = validate_mapping(mapping)
            assert result is True, f"Opération {op} rejetée: {errors}"
