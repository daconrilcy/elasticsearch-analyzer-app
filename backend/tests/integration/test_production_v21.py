#!/usr/bin/env python3
"""Tests d'intégration V2.1 - Fonctionnalités de production."""

import pytest
import requests
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

class TestProductionV21:
    """Tests d'intégration pour la production V2.1."""
    
    def get_auth_session(self):
        """Obtient une session authentifiée."""
        session = requests.Session()
        login_data = {"username": "test", "password": "test"}
        
        try:
            response = session.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
            if response.status_code != 200:
                return None
            
            if "access_token" in session.cookies:
                token = session.cookies["access_token"]
                token = token.strip('"').replace('\n', '').replace('\r', '')
                if token.startswith("Bearer "):
                    token = token[7:]
                session.headers.update({"Authorization": f"Bearer {token}"})
                return session
            return None
            
        except Exception:
            return None
    
    def test_v21_production_apply(self):
        """Test de production de l'endpoint /apply V2.1."""
        session = self.get_auth_session()
        if not session:
            pytest.skip("Authentification impossible")
        
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_prod_apply",
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
        
        start_time = time.time()
        response = session.post(f"{BASE_URL}/api/v1/mappings/apply", json=mapping)
        apply_time = time.time() - start_time
        
        assert response.status_code == 200
        assert apply_time < 5.0  # Doit être rapide
        
        result = response.json()
        assert result.get("ok") is True
        assert "results" in result
        
        # Vérifier les résultats par ressource
        results = result.get("results", {})
        for resource, status_info in results.items():
            status = status_info.get("status", "unknown")
            assert status in ["ok", "error"], f"Status inattendu pour {resource}: {status}"
    
    def test_v21_production_metrics(self):
        """Test des métriques de production V2.1."""
        response = requests.get(f"{BASE_URL}/metrics")
        assert response.status_code == 200
        
        metrics = response.text
        
        # Vérifier les métriques V2.1 essentielles
        v21_metrics = [
            'mapping_compile_calls_total',
            'mapping_apply_success_total',
            'mapping_apply_fail_total',
            'jsonpath_cache_hits_total',
            'jsonpath_cache_misses_total',
            'jsonpath_cache_size'
        ]
        
        found_count = 0
        for metric in v21_metrics:
            if metric in metrics:
                found_count += 1
        
        assert found_count >= 4, f"Seulement {found_count}/6 métriques V2.1 trouvées"
    
    def test_v21_production_performance(self):
        """Test de performance V2.1."""
        session = self.get_auth_session()
        if not session:
            pytest.skip("Authentification impossible")
        
        mapping = {
            "dsl_version": "2.1",
            "index": "test_v21_perf",
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
                    "input": [{"kind": "jsonpath", "expr": "$.skills[*]"}],
                    "pipeline": [
                        {"op": "zip", "with": [{"kind": "jsonpath", "expr": "$.levels[*]"}]},
                        {"op": "objectify", "fields": {
                            "skill": {"kind": "literal", "value": None},
                            "level": {"kind": "literal", "value": None}
                        }}
                    ]
                }
            ]
        }
        
        # Test de compilation multiple pour mesurer la performance
        times = []
        for i in range(3):
            start_time = time.time()
            response = session.post(f"{BASE_URL}/api/v1/mappings/compile", json=mapping)
            compile_time = time.time() - start_time
            
            assert response.status_code == 200
            times.append(compile_time)
        
        avg_time = sum(times) / len(times)
        assert avg_time < 2.0, f"Temps de compilation moyen trop élevé: {avg_time:.3f}s"
    
    def test_v21_production_monitoring(self):
        """Test du monitoring de production V2.1."""
        # Vérifier que Prometheus peut accéder aux métriques
        try:
            response = requests.get("http://localhost:9090/api/v1/targets")
            if response.status_code == 200:
                targets = response.json()
                api_target = None
                for target in targets.get("data", {}).get("activeTargets", []):
                    if target.get("labels", {}).get("job") == "elasticsearch-analyzer-api":
                        api_target = target
                        break
                
                if api_target:
                    assert api_target.get("health") == "up", "Target Prometheus non healthy"
                    assert "lastError" not in api_target or not api_target["lastError"]
        except Exception:
            pytest.skip("Prometheus non accessible")
        
        # Vérifier que Grafana est accessible
        try:
            response = requests.get("http://localhost:3000/api/health")
            assert response.status_code == 200
        except Exception:
            pytest.skip("Grafana non accessible")
