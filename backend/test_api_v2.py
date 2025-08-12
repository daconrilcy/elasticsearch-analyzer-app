#!/usr/bin/env python3
"""Test simple de l'API V2."""

import requests
import json
import time

def test_api_v2():
    """Test de l'API V2."""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Test de l'API V2")
    print("=" * 50)
    
    # Attendre que l'API soit prête
    print("⏳ Attente de l'API...")
    for i in range(10):
        try:
            response = requests.get(f"{base_url}/docs")
            if response.status_code == 200:
                print("✅ API prête")
                break
        except:
            pass
        time.sleep(1)
        print(f"   Tentative {i+1}/10...")
    else:
        print("❌ API non accessible")
        return False
    
    # Test 1: Validation V2
    print("\n1️⃣ Test de validation V2...")
    
    mapping_v2 = {
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
    
    try:
        response = requests.post(f"{base_url}/mappings/validate", json=mapping_v2)
        if response.status_code == 200:
            result = response.json()
            if result.get("valid"):
                print("✅ Validation V2 réussie")
            else:
                print(f"❌ Validation V2 échouée: {result.get('errors')}")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur de validation: {e}")
        return False
    
    # Test 2: Compilation V2
    print("\n2️⃣ Test de compilation V2...")
    
    try:
        response = requests.post(f"{base_url}/mappings/compile", json=mapping_v2)
        if response.status_code == 200:
            result = response.json()
            mappings = result.get("mappings", {}).get("properties", {})
            
            if "contacts" in mappings and mappings["contacts"]["type"] == "nested":
                print("✅ Compilation V2 réussie")
                print(f"   Structure: {json.dumps(mappings, indent=2)}")
            else:
                print(f"❌ Compilation V2 échouée: structure incorrecte")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur de compilation: {e}")
        return False
    
    # Test 3: Dry-run V2
    print("\n3️⃣ Test de dry-run V2...")
    
    rows = [
        {
            "contacts": [
                {"phone": "01"},
                {"phone": "02"}
            ]
        }
    ]
    
    try:
        response = requests.post(f"{base_url}/mappings/dry-run", json={"rows": rows, **mapping_v2})
        if response.status_code == 200:
            result = response.json()
            
            if "docs_preview" in result and len(result["docs_preview"]) == 1:
                doc = result["docs_preview"][0]["_source"]
                
                if "contacts" in doc and isinstance(doc["contacts"], list):
                    print("✅ Dry-run V2 réussi")
                    print(f"   Document: {json.dumps(doc, indent=2)}")
                else:
                    print(f"❌ Dry-run V2 échoué: structure incorrecte")
                    return False
            else:
                print(f"❌ Dry-run V2 échoué: pas de documents")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur de dry-run: {e}")
        return False
    
    print("\n🎉 Tous les tests API V2 ont réussi !")
    return True

if __name__ == "__main__":
    success = test_api_v2()
    exit(0 if success else 1)
