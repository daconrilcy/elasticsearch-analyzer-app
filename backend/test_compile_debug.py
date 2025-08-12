#!/usr/bin/env python3
"""Debug de la compilation V2"""

import requests
import json

def test_compile_debug():
    """Test de compilation avec debug détaillé."""
    
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
            }
        ]
    }
    
    print("🧪 Test de compilation V2 avec debug...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/compile/test",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Réponse complète: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n📊 Résultat JSON:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # Vérifier la structure
            if "compiled" in result:
                print(f"\n✅ Champ 'compiled' présent: {result['compiled']}")
            else:
                print(f"\n❌ Champ 'compiled' absent")
            
            if "mappings" in result:
                print(f"\n✅ Champ 'mappings' présent: {result['mappings']}")
            else:
                print(f"\n❌ Champ 'mappings' absent")
                
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == "__main__":
    test_compile_debug()
