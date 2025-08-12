#!/usr/bin/env python3
"""
Script de démonstration pour tester les endpoints de validation DSL des mappings.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ENDPOINTS = True  # Utilise les endpoints /test sans authentification

def test_mapping_dsl():
    """Teste les endpoints de validation DSL avec un mapping valide."""
    
    # Mapping DSL de test
    mapping = {
        "index": "demo_users",
        "globals": {
            "nulls": ["", "NULL", "null"],
            "bool_true": ["true", "1", "yes"],
            "bool_false": ["false", "0", "no"],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": ["%Y-%m-%d", "%d/%m/%Y"],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {"sample_size": 100, "seed": 42}
        },
        "id_policy": {
            "from": ["user_id", "email"],
            "op": "concat",
            "sep": "_",
            "on_conflict": "error"
        },
        "fields": [
            {
                "target": "user_info.name",
                "type": "text",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}, {"op": "lowercase"}],
                "analyzer": "standard"
            },
            {
                "target": "user_info.age",
                "type": "long",
                "input": [{"kind": "column", "name": "user_age"}],
                "pipeline": [{"op": "parse_number"}]
            },
            {
                "target": "user_info.email",
                "type": "keyword",
                "input": [{"kind": "column", "name": "email_address"}],
                "pipeline": [{"op": "trim"}, {"op": "lowercase"}],
                "normalizer": "lowercase"
            },
            {
                "target": "user_info.birth_date",
                "type": "date",
                "input": [{"kind": "column", "name": "birth_date"}],
                "pipeline": [{"op": "parse_date", "params": {"format": "%Y-%m-%d"}}],
                "format": "strict_date"
            }
        ],
        "settings": {
            "analysis": {
                "analyzer": {
                    "standard": {
                        "type": "standard"
                    }
                },
                "normalizer": {
                    "lowercase": {
                        "type": "custom",
                        "filter": ["lowercase"]
                    }
                }
            }
        }
    }
    
    print("🔍 Test de validation DSL des mappings")
    print("=" * 50)
    
    # Test 1: Validation
    print("\n1️⃣ Test de validation...")
    try:
        endpoint = "/api/v1/mappings/validate/test" if TEST_ENDPOINTS else "/api/v1/mappings/validate"
        response = requests.post(f"{BASE_URL}{endpoint}", json=mapping)
        
        if response.status_code == 200:
            result = response.json()
            if result["errors"]:
                print("❌ Erreurs de validation trouvées:")
                for error in result["errors"]:
                    print(f"   - {error['code']}: {error['msg']} (à {error['path']})")
            else:
                print("✅ Mapping DSL valide !")
                if result["warnings"]:
                    print("⚠️  Avertissements:")
                    for warning in result["warnings"]:
                        print(f"   - {warning['msg']}")
        else:
            print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur. Assurez-vous qu'il est démarré sur http://localhost:8000")
        return
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 2: Compilation
    print("\n2️⃣ Test de compilation...")
    try:
        endpoint = "/api/v1/mappings/compile/test" if TEST_ENDPOINTS else "/api/v1/mappings/compile"
        response = requests.post(f"{BASE_URL}{endpoint}", json=mapping, params={"includePlan": True})
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Mapping compilé avec succès !")
            print(f"   - Settings: {len(result['settings'])} propriétés")
            print(f"   - Mappings: {len(result['mappings']['properties'])} champs")
            if result["execution_plan"]:
                print(f"   - Plan d'exécution: {len(result['execution_plan'])} opérations")
        else:
            print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 3: Dry-run
    print("\n3️⃣ Test de dry-run...")
    try:
        endpoint = "/api/v1/mappings/dry-run/test" if TEST_ENDPOINTS else "/api/v1/mappings/dry-run"
        response = requests.post(f"{BASE_URL}{endpoint}", json=mapping)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Dry-run exécuté avec succès !")
            print(f"   - Aperçu des documents: {len(result['docs_preview'])} exemples")
            if result["issues"]:
                print(f"   - Problèmes détectés: {len(result['issues'])}")
        else:
            print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Tests terminés !")

if __name__ == "__main__":
    test_mapping_dsl()
