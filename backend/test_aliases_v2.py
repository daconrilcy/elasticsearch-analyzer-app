#!/usr/bin/env python3
"""
Test des alias d'opérations dans un mapping V2 réel
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.domain.mapping.executor.executor import run_dry_run

def test_aliases_in_mapping():
    """Test des alias dans un mapping V2."""
    print("🧪 Test des alias d'opérations dans un mapping V2...")
    
    # Mapping V2 avec alias d'opérations
    mapping = {
        "dsl_version": "2.0",
        "index": "aliases_test",
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name_lower",
                "type": "keyword",
                "input": [{"kind": "column", "name": "name"}],
                "pipeline": [{"op": "lowercase"}]  # Alias pour "lower"
            },
            {
                "target": "name_upper",
                "type": "keyword",
                "input": [{"kind": "column", "name": "name"}],
                "pipeline": [{"op": "uppercase"}]  # Alias pour "upper"
            },
            {
                "target": "phone_clean",
                "type": "keyword",
                "input": [{"kind": "column", "name": "phone"}],
                "pipeline": [
                    {"op": "replace", "pattern": "\\+33", "repl": "0"}  # Alias pour "regex_replace"
                ]
            },
            {
                "target": "tags_length",
                "type": "long",
                "input": [{"kind": "jsonpath", "expr": "$.tags"}],
                "pipeline": [
                    {"op": "map", "then": [{"op": "length"}]}  # Nouvelle opération
                ]
            },
            {
                "target": "tags_length_direct",
                "type": "long",
                "input": [{"kind": "column", "name": "tags"}],
                "pipeline": [{"op": "length"}]  # Test direct
            },
            {
                "target": "status",
                "type": "keyword",
                "input": [{"kind": "column", "name": "age"}],
                "pipeline": [
                    {
                        "op": "when",
                        "cond": {"gt": 18},  # Nouvelle condition
                        "then": [{"op": "literal", "value": "adult"}],  # Nouvelle opération
                        "else": [{"op": "literal", "value": "minor"}]
                    }
                ]
            }
        ]
    }
    
    # Données de test
    rows = [
        {
            "name": "John DOE",
            "phone": "+33123456789",
            "age": 25,
            "tags": ["developer", "python", "elasticsearch"]
        }
    ]
    
    try:
        # Test direct de JSONPath pour debug
        print("🔍 Test direct de JSONPath...")
        from jsonpath_ng import parse
        
        # Test différentes expressions JSONPath
        test_exprs = [
            "$.tags[*]",
            "$.tags",
            "$.tags[0:]",
            "$.tags[0:3]"
        ]
        
        for expr_str in test_exprs:
            expr = parse(expr_str)
            matches = [m.value for m in expr.find(rows[0])]
            print(f"  JSONPath {expr_str} -> {matches} (type: {type(matches)})")
            if matches:
                print(f"    Premier match: {matches[0]} (type: {type(matches[0])})")
                if len(matches) > 1:
                    print(f"    Tous les matches: {matches}")
        

        
        # Exécuter le dry-run
        result = run_dry_run(mapping, rows)
        
        print(f"DEBUG: Structure du résultat: {result.keys()}")
        
        if "docs_preview" in result:
            print("✅ Dry-run exécuté avec succès")
            print(f"📊 Nombre de documents: {len(result['docs_preview'])}")
            
            # Afficher les issues s'il y en a
            if result.get("issues"):
                print(f"⚠️  Issues: {len(result['issues'])}")
                for issue in result["issues"]:
                    print(f"  - {issue}")
            
            doc = result["docs_preview"][0]["_source"]
            print(f"\n📄 Document généré:")
            print(f"  name_lower: {doc.get('name_lower')}")
            print(f"  name_upper: {doc.get('name_upper')}")
            print(f"  phone_clean: {doc.get('phone_clean')}")
            print(f"  tags_length: {doc.get('tags_length')}")
            print(f"  tags_length_direct: {doc.get('tags_length_direct')}")
            print(f"  status: {doc.get('status')}")
            
            # Vérifications
            assert doc.get("name_lower") == "john doe", f"name_lower incorrect: {doc.get('name_lower')}"
            assert doc.get("name_upper") == "JOHN DOE", f"name_upper incorrect: {doc.get('name_upper')}"
            assert doc.get("phone_clean") == "0123456789", f"phone_clean incorrect: {doc.get('phone_clean')}"
            assert doc.get("tags_length") == [9, 6, 13], f"tags_length incorrect: {doc.get('tags_length')}"
            assert doc.get("status") == "adult", f"status incorrect: {doc.get('status')}"
            
            print("\n✅ Toutes les vérifications sont passées !")
            print("🎉 Les alias d'opérations fonctionnent parfaitement !")
            
        else:
            print(f"❌ Dry-run échoué: {result}")
            return 1
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

def main():
    """Exécute le test principal."""
    print("🚀 Test des alias d'opérations V2...\n")
    return test_aliases_in_mapping()

if __name__ == "__main__":
    exit(main())
