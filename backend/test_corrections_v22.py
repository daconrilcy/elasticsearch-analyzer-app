#!/usr/bin/env python3
"""Test des corrections V2.2 immédiates."""

import json
import sys
import os

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_schema_v22():
    """Test du schéma V2.2 corrigé."""
    print("🧪 Test du schéma V2.2...")
    
    try:
        from app.domain.mapping.validators.common.mapping import get_schema, get_schema_info
        
        schema = get_schema()
        info = get_schema_info()
        
        print(f"✅ Schéma chargé: {info['version']}")
        print(f"   - Titre: {info['title']}")
        print(f"   - Propriétés: {info['properties_count']}")
        print(f"   - Définitions: {info['definitions_count']}")
        
        # Vérifier que les types manquants sont présents
        types_enum = schema["properties"]["fields"]["items"]["properties"]["type"]["enum"]
        missing_types = ["integer", "ip"]
        for t in missing_types:
            if t in types_enum:
                print(f"✅ Type '{t}' présent dans l'enum")
            else:
                print(f"❌ Type '{t}' manquant dans l'enum")
                return False
        
        # Vérifier que les opérations V2.2 sont présentes
        ops_enum = schema["properties"]["fields"]["items"]["properties"]["pipeline"]["items"]["oneOf"]
        v22_ops = ["filter", "slice", "unique", "sort"]
        for op in v22_ops:
            op_refs = [ref for ref in ops_enum if ref.get("$ref", "").endswith(f"Op{op.capitalize()}")]
            if op_refs:
                print(f"✅ Opération '{op}' présente dans le schéma")
            else:
                print(f"❌ Opération '{op}' manquante dans le schéma")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test du schéma: {e}")
        return False

def test_validation_v22():
    """Test de la validation V2.2."""
    print("\n🧪 Test de la validation V2.2...")
    
    try:
        from app.domain.mapping.validators.common.json_validator import validate_mapping
        
        # Test 1: Mapping valide avec types integer/ip
        valid_mapping = {
            "dsl_version": "2.2",
            "index": "test",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [],
                "decimal_sep": ",", "thousands_sep": " ",
                "date_formats": [], "default_tz": "Europe/Paris",
                "empty_as_null": True, "preview": {}
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "count",
                    "type": "integer",
                    "input": [{"kind": "literal", "value": 42}],
                    "pipeline": []
                },
                {
                    "target": "ip_addr",
                    "type": "ip",
                    "input": [{"kind": "literal", "value": "192.168.1.1"}],
                    "pipeline": []
                }
            ]
        }
        
        is_valid, issues = validate_mapping(valid_mapping)
        if is_valid:
            print("✅ Mapping avec types integer/ip validé")
        else:
            print(f"❌ Mapping avec types integer/ip rejeté: {issues}")
            return False
        
        # Test 2: Validation des règles V2.2
        invalid_mapping = {
            "dsl_version": "2.2",
            "index": "test",
            "globals": {
                "nulls": [], "bool_true": [], "bool_false": [],
                "decimal_sep": ",", "thousands_sep": " ",
                "date_formats": [], "default_tz": "Europe/Paris",
                "empty_as_null": True, "preview": {}
            },
            "id_policy": {
                "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "description",
                    "type": "text",
                    "input": [{"kind": "literal", "value": "test"}],
                    "pipeline": [],
                    "ignore_above": 256  # ❌ Interdit sur text
                }
            ]
        }
        
        is_valid, issues = validate_mapping(invalid_mapping)
        if not is_valid and any("E_IGNORE_ABOVE_INVALID_TYPE" in str(issue) for issue in issues):
            print("✅ Règle ignore_above sur text détectée")
        else:
            print(f"❌ Règle ignore_above sur text non détectée: {issues}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test de validation: {e}")
        return False

def test_endpoint_schema():
    """Test de l'endpoint schema."""
    print("\n🧪 Test de l'endpoint schema...")
    
    try:
        from app.domain.mapping.validators.common.mapping import get_schema, get_schema_info
        
        schema = get_schema()
        info = get_schema_info()
        
        # Vérifier que le schéma est accessible
        if schema and "$id" in schema:
            print(f"✅ Endpoint schema accessible: {info['version']}")
            return True
        else:
            print("❌ Endpoint schema non accessible")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test de l'endpoint: {e}")
        return False

def main():
    """Test principal des corrections V2.2."""
    print("🚀 Test des Corrections V2.2 Immédiates")
    print("=" * 50)
    
    tests = [
        ("Schéma V2.2", test_schema_v22),
        ("Validation V2.2", test_validation_v22),
        ("Endpoint Schema", test_endpoint_schema)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur dans {test_name}: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Résultats des Tests")
    print("=" * 50)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 Toutes les corrections V2.2 sont fonctionnelles !")
    else:
        print("⚠️  Certaines corrections V2.2 ont échoué.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
