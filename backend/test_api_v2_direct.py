#!/usr/bin/env python3
"""
Test direct de l'API V2 sans authentification
"""

import requests
import json

def test_mapping_v2_validation():
    """Test de validation d'un mapping V2."""
    
    # Mapping V2 de test
    mapping_v2 = {
        "dsl_version": "2.0",
        "index": "test_v2",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": ["yyyy-MM-dd"],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {
                "sample_size": 10,
                "seed": 1
            }
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            },
            {
                "target": "tags_length",
                "type": "long",
                "input": [{"kind": "jsonpath", "expr": "$.tags"}],
                "pipeline": [
                    {"op": "map", "then": [{"op": "length"}]}
                ]
            }
        ]
    }
    
    try:
        # Test de validation
        print("🧪 Test de validation V2...")
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/validate/test",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Validation réussie!")
            print(f"Erreurs: {len(result.get('errors', []))}")
            print(f"Warnings: {len(result.get('warnings', []))}")
            
            if result.get('errors'):
                print("❌ Erreurs détectées:")
                for error in result['errors']:
                    print(f"  - {error}")
            
            if result.get('warnings'):
                print("⚠️  Warnings détectés:")
                for warning in result['warnings']:
                    print(f"  - {warning}")
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

def test_mapping_v2_compile():
    """Test de compilation d'un mapping V2."""
    
    mapping_v2 = {
        "dsl_version": "2.0",
        "index": "test_v2",
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    try:
        print("\n🧪 Test de compilation V2...")
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/compile/test",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Compilation réussie!")
            print(f"Mapping ES généré: {result.get('compiled') is not None}")
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

def test_mapping_v2_dry_run():
    """Test de dry-run d'un mapping V2."""
    
    mapping_v2 = {
        "dsl_version": "2.0",
        "index": "test_v2",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": ["yyyy-MM-dd"],
            "default_tz": "Europe/Paris",
            "empty_as_null": True,
            "preview": {
                "sample_size": 10,
                "seed": 1
            }
        },
        "id_policy": {
            "from": ["id"],
            "op": "concat",
            "sep": ":",
            "on_conflict": "error"
        },
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            },
            {
                "target": "tags_length",
                "type": "long",
                "input": [{"kind": "jsonpath", "expr": "$.tags"}],
                "pipeline": [
                    {"op": "map", "then": [{"op": "length"}]}
                ]
            }
        ],
        "rows": [
            {
                "id": "1",
                "full_name": "  John DOE  ",
                "tags": ["developer", "python", "elasticsearch"]
            }
        ]
    }
    
    try:
        print("\n🧪 Test de dry-run V2...")
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/dry-run",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Dry-run réussi!")
            print(f"Documents générés: {len(result.get('docs_preview', []))}")
            print(f"Issues: {len(result.get('issues', []))}")
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == "__main__":
    print("🚀 Test de l'API V2 - Endpoints de mapping")
    print("=" * 50)
    
    test_mapping_v2_validation()
    test_mapping_v2_compile()
    test_mapping_v2_dry_run()
    
    print("\n�� Tests terminés!")
