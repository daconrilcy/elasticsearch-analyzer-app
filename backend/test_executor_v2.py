#!/usr/bin/env python3
"""Test de l'exécuteur V2 avec containers et ops array-aware."""

import json
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.domain.mapping.executor.executor import run_dry_run

def test_executor_v2():
    """Test complet de l'exécuteur V2."""
    
    # Mapping V2 avec containers et ops array-aware
    mapping = {
        "dsl_version": "2.0",
        "index": "users_v2",
        "globals": {
            "nulls": [],
            "bool_true": [],
            "bool_false": [],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": ["yyyy-MM-dd"],
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
            },
            {
                "path": "address",
                "type": "object"
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
                "pipeline": [
                    {
                        "op": "map",
                        "then": [
                            {
                                "op": "trim"
                            }
                        ]
                    }
                ]
            },
            {
                "target": "tags_first",
                "type": "keyword",
                "input": [
                    {
                        "kind": "jsonpath",
                        "expr": "$.tags[*]"
                    }
                ],
                "pipeline": [
                    {
                        "op": "take",
                        "which": "first"
                    }
                ]
            },
            {
                "target": "tags_joined",
                "type": "keyword",
                "input": [
                    {
                        "kind": "jsonpath",
                        "expr": "$.tags[*]"
                    }
                ],
                "pipeline": [
                    {
                        "op": "join",
                        "sep": "|"
                    }
                ]
            },
            {
                "target": "flat_numbers",
                "type": "keyword",
                "input": [
                    {
                        "kind": "literal",
                        "value": [[1, 2], [3]]
                    }
                ],
                "pipeline": [
                    {
                        "op": "flatten"
                    },
                    {
                        "op": "join",
                        "sep": ","
                    }
                ]
            }
        ]
    }
    
    # Données de test
    rows = [
        {
            "id": "user1",
            "contacts": [
                {"phone": " 01 "},
                {"phone": "02"}
            ],
            "tags": ["foo", "bar", "baz"]
        }
    ]
    
    print("🧪 Test de l'exécuteur V2")
    print("=" * 50)
    
    try:
        # Exécution du dry-run
        result = run_dry_run(mapping, rows)
        
        print("✅ Dry-run exécuté avec succès")
        print(f"📊 Nombre de documents: {len(result['docs_preview'])}")
        print(f"⚠️  Issues: {len(result['issues'])}")
        
        if result['issues']:
            print("\n🚨 Issues détectées:")
            for issue in result['issues']:
                print(f"  - {issue}")
        
        # Affichage du premier document
        if result['docs_preview']:
            doc = result['docs_preview'][0]
            print(f"\n📄 Document généré (ID: {doc['_id']}):")
            print(json.dumps(doc['_source'], indent=2, ensure_ascii=False))
            
            # Vérifications spécifiques
            source = doc['_source']
            
            # Test contacts nested
            if 'contacts' in source and isinstance(source['contacts'], list):
                print(f"\n✅ Contacts nested: {len(source['contacts'])} éléments")
                for i, contact in enumerate(source['contacts']):
                    print(f"  Contact {i}: {contact}")
            
            # Test tags_first
            if 'tags_first' in source:
                print(f"✅ tags_first: '{source['tags_first']}'")
            
            # Test tags_joined
            if 'tags_joined' in source:
                print(f"✅ tags_joined: '{source['tags_joined']}'")
            
            # Test flat_numbers
            if 'flat_numbers' in source:
                print(f"✅ flat_numbers: '{source['flat_numbers']}'")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_executor_v2()
    sys.exit(0 if success else 1)
