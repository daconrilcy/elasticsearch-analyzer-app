#!/usr/bin/env python3
"""Test direct du schéma JSON V2"""

import json
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from jsonschema import Draft202012Validator

def test_schema_direct():
    """Test direct du schéma JSON."""
    
    # Charger le schéma
    schema_path = "app/domain/mapping/validators/common/mapping.schema.json"
    
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema = json.load(f)
        print("✅ Schéma JSON chargé avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du chargement du schéma: {e}")
        return
    
    # Créer un validateur
    try:
        validator = Draft202012Validator(schema)
        print("✅ Validateur JSON créé avec succès")
    except Exception as e:
        print(f"❌ Erreur lors de la création du validateur: {e}")
        return
    
    # Test avec un mapping V2 simple
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
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    print("\n🧪 Test de validation du mapping V2...")
    
    # Valider
    errors = list(validator.iter_errors(mapping_v2))
    
    if not errors:
        print("✅ Validation réussie - Aucune erreur")
        return True
    else:
        print(f"❌ Validation échouée - {len(errors)} erreur(s)")
        for error in errors:
            path = "/" + "/".join(str(p) for p in error.path)
            print(f"  - {path}: {error.message}")
            print(f"    Validateur: {error.validator}")
            print(f"    Valeur: {error.instance}")
        return False

if __name__ == "__main__":
    test_schema_direct()
