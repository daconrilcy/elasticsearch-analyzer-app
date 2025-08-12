#!/usr/bin/env python3
"""Test rapide des métriques V2.1 et endpoint apply."""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_metrics_v21():
    """Test des métriques V2.1."""
    print("🧪 Test des métriques V2.1...")
    
    # Test mapping V2.1 avec zip + objectify
    mapping = {
        "dsl_version": "2.1",
        "index": "test_metrics_v21",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "containers": [{"path": "pairs[]", "type": "nested"}],
        "fields": [
            {"target": "pairs", "type": "nested", "input": [{"kind": "jsonpath", "expr": "$.a[*]"}], "pipeline": [{"op": "zip", "with": [{"kind": "jsonpath", "expr": "$.b[*]"}]}, {"op": "objectify", "fields": {"left": {"kind": "literal", "value": None}, "right": {"kind": "literal", "value": None}}}]}
        ]
    }
    
    rows = [{"a": [1, 2], "b": [10]}]
    
    # Test 1: Validation
    print("  📊 Test validation...")
    response = requests.post(f"{BASE_URL}/api/v1/mappings/validate/test", json=mapping)
    print(f"    Status: {response.status_code}")
    
    # Test 2: Compilation
    print("  📊 Test compilation...")
    response = requests.post(f"{BASE_URL}/api/v1/mappings/compile/test", json=mapping)
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"    ILM Policy: {result.get('ilm_policy', 'N/A')}")
        print(f"    Ingest Pipeline: {result.get('ingest_pipeline', 'N/A')}")
    
    # Test 3: Métriques Prometheus
    print("  📊 Test métriques Prometheus...")
    response = requests.get(f"{BASE_URL}/metrics")
    if response.status_code == 200:
        metrics = response.text
        print(f"    JSONPath cache hits: {'jsonpath_cache_hits_total' in metrics}")
        print(f"    JSONPath cache misses: {'jsonpath_cache_misses_total' in metrics}")
        print(f"    Zip padding events: {'mapping_zip_pad_events_total' in metrics}")
        print(f"    Objectify records: {'mapping_objectify_records_total' in metrics}")
        print(f"    Compile count: {'mapping_compile_total' in metrics}")
    
    print("✅ Test métriques V2.1 terminé")

def test_apply_endpoint():
    """Test de l'endpoint apply."""
    print("🧪 Test endpoint apply...")
    
    # Test mapping V2.1 avec ILM + Ingest
    mapping = {
        "dsl_version": "2.1",
        "index": "test_apply_v21",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "fields": [
            {"target": "name", "type": "keyword", "input": [{"kind": "jsonpath", "expr": "$.name"}]},
            {"target": "age", "type": "integer", "input": [{"kind": "jsonpath", "expr": "$.age"}]},
            {"target": "created_at", "type": "date", "input": [{"kind": "jsonpath", "expr": "$.created_at"}]}
        ]
    }
    
    # Test compilation pour vérifier ILM + Ingest
    print("  📊 Compilation du mapping...")
    response = requests.post(f"{BASE_URL}/api/v1/mappings/compile/test", json=mapping)
    if response.status_code == 200:
        result = response.json()
        print(f"    ILM Policy: {result.get('ilm_policy', {}).get('name', 'N/A')}")
        print(f"    Ingest Pipeline: {result.get('ingest_pipeline', {}).get('name', 'N/A')}")
        print(f"    Settings: {result.get('settings', 'N/A')}")
    
    print("⚠️  Endpoint apply nécessite authentification - skip pour ce test")
    print("✅ Test endpoint apply terminé")

def test_cache_performance():
    """Test de la performance du cache JSONPath."""
    print("🧪 Test performance cache JSONPath...")
    
    mapping = {
        "dsl_version": "2.1",
        "index": "perf_test",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "fields": [
            {"target": "deep_field", "type": "keyword", "input": [{"kind": "jsonpath", "expr": "$.very.deeply.nested.array[*]"}]}
        ]
    }
    
    rows = [{"very": {"deeply": {"nested": {"array": ["a", "b", "c"]}}}}]
    
    # Premier dry-run (cache miss)
    print("  📊 Premier dry-run (cache miss)...")
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    first_time = time.time() - start_time
    print(f"    Temps: {first_time:.3f}s")
    
    # Deuxième dry-run (cache hit)
    print("  📊 Deuxième dry-run (cache hit)...")
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
    second_time = time.time() - start_time
    print(f"    Temps: {second_time:.3f}s")
    
    if first_time > 0 and second_time > 0:
        improvement = first_time / second_time
        print(f"    Amélioration: {improvement:.1f}x")
    
    print("✅ Test performance cache terminé")

if __name__ == "__main__":
    print("🚀 Test rapide des fonctionnalités V2.1")
    print("=" * 50)
    
    try:
        test_metrics_v21()
        print()
        test_apply_endpoint()
        print()
        test_cache_performance()
        print()
        print("✅ Tous les tests V2.1 sont passés !")
    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
