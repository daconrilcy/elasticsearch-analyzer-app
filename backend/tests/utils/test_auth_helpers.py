#!/usr/bin/env python3
"""Helpers d'authentification pour les tests V2.1."""

import requests
from typing import Optional

BASE_URL = "http://localhost:8000"

def get_auth_session() -> Optional[requests.Session]:
    """Obtient une session authentifiée pour les tests V2.1."""
    session = requests.Session()
    login_data = {"username": "test", "password": "test"}
    
    try:
        response = session.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        if response.status_code != 200:
            return None
        
        if "access_token" in session.cookies:
            token = session.cookies["access_token"]
            # Nettoyer le token
            token = token.strip('"').replace('\n', '').replace('\r', '')
            if token.startswith("Bearer "):
                token = token[7:]
            
            # Ajouter l'en-tête d'autorisation
            session.headers.update({"Authorization": f"Bearer {token}"})
            return session
        else:
            return None
            
    except Exception:
        return None

def create_test_mapping_v21(index_name: str = "test_v21", 
                           containers: list = None,
                           fields: list = None) -> dict:
    """Crée un mapping de test V2.1 standard."""
    if containers is None:
        containers = []
    
    if fields is None:
        fields = [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": "$.name"}]
            }
        ]
    
    return {
        "dsl_version": "2.1",
        "index": index_name,
        "globals": {
            "nulls": [], "bool_true": [], "bool_false": [], 
            "decimal_sep": ",", "thousands_sep": " ", 
            "date_formats": [], "default_tz": "Europe/Paris", 
            "empty_as_null": True
        },
        "id_policy": {
            "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
        },
        "containers": containers,
        "fields": fields
    }

def create_test_data_v21(rows: list = None) -> dict:
    """Crée des données de test V2.1 standard."""
    if rows is None:
        rows = [
            {"id": "test1", "name": "Test User 1"},
            {"id": "test2", "name": "Test User 2"}
        ]
    
    return {"rows": rows}

def assert_v21_response_structure(response_data: dict):
    """Vérifie la structure de réponse V2.1 standard."""
    assert isinstance(response_data, dict)
    
    # Pour les réponses de compilation
    if "mappings" in response_data:
        assert "properties" in response_data["mappings"]
        if "ilm_policy" in response_data:
            assert "name" in response_data["ilm_policy"]
        if "ingest_pipeline" in response_data:
            assert "name" in response_data["ingest_pipeline"]
    
    # Pour les réponses de dry-run
    if "docs_preview" in response_data:
        assert isinstance(response_data["docs_preview"], list)
        if response_data["docs_preview"]:
            assert "_source" in response_data["docs_preview"][0]
    
    # Pour les réponses d'apply
    if "results" in response_data:
        assert isinstance(response_data["results"], dict)
        for resource, status_info in response_data["results"].items():
            assert "status" in status_info
            assert status_info["status"] in ["ok", "error"]
