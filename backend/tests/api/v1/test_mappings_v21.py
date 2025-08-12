#!/usr/bin/env python3
"""Tests API V2.1 - Endpoints mappings."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestMappingsAPIv21:
    """Tests pour l'API mappings V2.1."""
    
    def test_v21_validate_endpoint(self):
        """Test endpoint /validate V2.1."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_validate_api",
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
                    "target": "name",
                    "type": "keyword",
                    "input": [{"kind": "jsonpath", "expr": "$.name"}]
                }
            ]
        }
        
        response = client.post("/api/v1/mappings/validate", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok") is True
    
    def test_v21_compile_endpoint(self):
        """Test endpoint /compile V2.1."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_compile_api",
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
        
        response = client.post("/api/v1/mappings/compile", json=mapping)
        assert response.status_code == 200
        
        result = response.json()
        assert "mappings" in result
        assert "ilm_policy" in result
        assert "ingest_pipeline" in result
    
    def test_v21_dry_run_endpoint(self):
        """Test endpoint /dry-run V2.1."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_dryrun_api",
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
        
        test_data = {
            "rows": [{"id": "test1", "name": "Test User"}]
        }
        
        response = client.post("/api/v1/mappings/dry-run", 
                              json={**mapping, **test_data})
        assert response.status_code == 200
        
        result = response.json()
        assert "docs_preview" in result
        assert len(result["docs_preview"]) > 0
    
    def test_v21_apply_endpoint_requires_auth(self):
        """Test que l'endpoint /apply V2.1 nécessite une authentification."""
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_apply_api",
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
        
        response = client.post("/api/v1/mappings/apply", json=mapping)
        assert response.status_code == 401  # Non authentifié

