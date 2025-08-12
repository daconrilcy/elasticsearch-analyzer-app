#!/usr/bin/env python3
"""
Test simplifié des nouvelles opérations V2
- Aliases d'opérations
- Nouvelles opérations
- Conditions enrichies
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.domain.mapping.executor.executor import _compile_pipeline, OP_ALIAS
from app.domain.mapping.executor.ops import OP_REGISTRY, eval_condition

def test_operation_aliases():
    """Test des alias d'opérations."""
    print("🧪 Test des alias d'opérations...")
    
    # Test des alias
    assert OP_ALIAS["lowercase"] == "lower"
    assert OP_ALIAS["uppercase"] == "upper"
    assert OP_ALIAS["replace"] == "regex_replace"
    
    # Test de compilation avec alias
    pipeline = [
        {"op": "lowercase"},
        {"op": "uppercase"},
        {"op": "replace", "pattern": "a", "replacement": "b"}
    ]
    
    compiled = _compile_pipeline(pipeline)
    assert compiled[0][0] == "lower"  # lowercase -> lower
    assert compiled[1][0] == "upper"  # uppercase -> upper
    assert compiled[2][0] == "regex_replace"  # replace -> regex_replace
    
    print("✅ Alias d'opérations OK")

def test_new_operations():
    """Test des nouvelles opérations."""
    print("🧪 Test des nouvelles opérations...")
    
    # Test op_length
    assert "length" in OP_REGISTRY
    op_length = OP_REGISTRY["length"]
    
    # Test avec différents types
    assert op_length("hello") == 5
    assert op_length([1, 2, 3]) == 3
    assert op_length({"a": 1, "b": 2}) == 2
    assert op_length(None) == 0
    
    # Test op_literal
    assert "literal" in OP_REGISTRY
    op_literal = OP_REGISTRY["literal"]
    
    # Test avec différentes valeurs
    assert op_literal(None, "test") == "test"
    assert op_literal(None, 42) == 42
    assert op_literal(None, [1, 2, 3]) == [1, 2, 3]
    
    # Test op_regex_extract
    assert "regex_extract" in OP_REGISTRY
    op_regex_extract = OP_REGISTRY["regex_extract"]
    
    # Test extraction simple
    result = op_regex_extract("ERROR: Database connection failed", "ERROR: (.+)")
    assert result == "Database connection failed"
    
    # Test avec groupe spécifique (groupe 1 = mois)
    result = op_regex_extract("2023-12-25", "(\\d{2})", group=1)
    print(f"DEBUG: regex_extract result = {result}")
    assert result == "20"  # Premier groupe de 2 chiffres dans "2023-12-25"
    
    # Test avec flags
    result = op_regex_extract("Hello WORLD", "(world)", flags="i")
    print(f"DEBUG: flags test result = {result}")
    assert result == "WORLD"  # Le pattern trouve "WORLD" dans "Hello WORLD"
    
    # Test garde-fou pattern trop long
    try:
        long_pattern = "a" * 2001
        op_regex_extract("test", long_pattern)
        assert False, "Devrait lever une erreur pour pattern trop long"
    except RuntimeError as e:
        assert "E_REGEX_GUARD" in str(e)
    
    # Test garde-fou look-behind
    try:
        op_regex_extract("test", "(?<=a)b")
        assert False, "Devrait lever une erreur pour look-behind"
    except RuntimeError as e:
        assert "E_REGEX_GUARD" in str(e)
    
    print("✅ Nouvelles opérations OK")

def test_enriched_conditions():
    """Test des conditions enrichies."""
    print("🧪 Test des conditions enrichies...")
    
    # Test gt (greater than)
    assert eval_condition({"gt": 5}, 10, {}) == True
    assert eval_condition({"gt": 5}, 3, {}) == False
    assert eval_condition({"gt": 5}, "10", {}) == True  # conversion automatique
    
    # Test gte (greater than or equal)
    assert eval_condition({"gte": 5}, 5, {}) == True
    assert eval_condition({"gte": 5}, 10, {}) == True
    assert eval_condition({"gte": 5}, 3, {}) == False
    
    # Test lt (less than)
    assert eval_condition({"lt": 10}, 5, {}) == True
    assert eval_condition({"lt": 10}, 15, {}) == False
    assert eval_condition({"lt": 10}, "5", {}) == True  # conversion automatique
    
    # Test lte (less than or equal)
    assert eval_condition({"lte": 10}, 10, {}) == True
    assert eval_condition({"lte": 10}, 5, {}) == True
    assert eval_condition({"lte": 10}, 15, {}) == False
    
    # Test contains
    assert eval_condition({"contains": "hello"}, "hello world", {}) == True
    assert eval_condition({"contains": "hello"}, "goodbye", {}) == False
    assert eval_condition({"contains": "hello"}, None, {}) == False
    
    # Test is_numeric
    assert eval_condition({"is_numeric": True}, "123", {}) == True
    assert eval_condition({"is_numeric": True}, "abc", {}) == False
    assert eval_condition({"is_numeric": True}, 456, {}) == True
    
    # Test formes courtes (sans "type")
    assert eval_condition({"gt": 5}, 10, {}) == True
    assert eval_condition({"contains": "test"}, "test string", {}) == True
    
    # Test conditions existantes (inchangées)
    assert eval_condition({"type": "is_empty"}, "", {}) == True
    assert eval_condition({"type": "is_number"}, "123", {}) == True
    assert eval_condition({"type": "matches", "regex": "\\d+"}, "123", {}) == True
    
    print("✅ Conditions enrichies OK")

def main():
    """Exécute tous les tests."""
    print("🚀 Démarrage des tests simplifiés des nouvelles opérations V2...\n")
    
    try:
        test_operation_aliases()
        test_new_operations()
        test_enriched_conditions()
        
        print("\n🎉 Tous les tests sont passés avec succès !")
        return 0
        
    except Exception as e:
        print(f"\n❌ Test échoué: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
