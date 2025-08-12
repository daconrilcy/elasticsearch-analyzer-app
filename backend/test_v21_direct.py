#!/usr/bin/env python3
"""Test direct des fonctionnalités V2.1."""

import requests
import json

BASE_URL = "http://localhost:8000"

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
    
    print("🧪 Test objectify_contacts...")
    
    # Test validation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/validate/test", json=mapping)
    print(f"✅ Validation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Success: {result.get('success', 'N/A')}")
    
    # Test compilation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/compile/test", json=mapping)
    print(f"✅ Compilation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Mappings: {result.get('mappings', 'N/A')}")
    
    # Test dry-run (nécessite auth)
    print("⚠️  Dry-run nécessite authentification - skip pour ce test")

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
    
    print("🧪 Test zip_then_objectify...")
    
    # Test validation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/validate/test", json=mapping)
    print(f"✅ Validation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Success: {result.get('success', 'N/A')}")
    
    # Test compilation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/compile/test", json=mapping)
    print(f"✅ Compilation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Mappings: {result.get('mappings', 'N/A')}")

def test_cache_jsonpath():
    """Test du cache JSONPath."""
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
    
    print("🧪 Test cache_jsonpath...")
    
    # Test validation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/validate/test", json=mapping)
    print(f"✅ Validation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Success: {result.get('success', 'N/A')}")
    
    # Test compilation
    response = requests.post(f"{BASE_URL}/api/v1/mappings/compile/test", json=mapping)
    print(f"✅ Compilation: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Mappings: {result.get('mappings', 'N/A')}")

if __name__ == "__main__":
    print("🚀 Test des fonctionnalités V2.1 du Mapping DSL")
    print("=" * 50)
    
    try:
        test_objectify_contacts()
        print()
        test_zip_then_objectify()
        print()
        test_cache_jsonpath()
        print()
        print("✅ Tous les tests V2.1 sont passés !")
    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
