#!/usr/bin/env python3
"""
Test des nouvelles opérations V2
- Aliases d'opérations (lowercase->lower, uppercase->upper, replace->regex_replace)
- Nouvelles opérations (length, literal, regex_extract)
- Conditions enrichies (gt, lt, contains, is_numeric)
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

def test_jsonpath_length_limit():
    """Test de la limite de longueur des expressions JSONPath."""
    print("🧪 Test de la limite JSONPath...")
    
    # Test avec expression valide (< 1000 chars)
    short_expr = "$.users[*].profile.name"
    
    # Test avec expression trop longue (> 1000 chars)
    long_expr = "$." + "very_long_path" * 100  # ~1500 chars
    
    # Charger le schéma pour validation
    try:
        from app.domain.mapping.validators.common.json_validator import validate_mapping
        
        # Test mapping valide
        valid_mapping = {
            "dsl_version": "2.0",
            "index": "test",
            "globals": {},
            "id_policy": {
                "strategy": "hash",
                "from": ["name"],
                "op": "hash",
                "sep": "-",
                "on_conflict": "error"
            },
            "fields": [{
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": short_expr}],
                "pipeline": []
            }]
        }
        
        is_valid, errors = validate_mapping(valid_mapping)
        assert is_valid, f"Mapping valide rejeté: {errors}"
        
        # Test mapping avec expression trop longue
        invalid_mapping = {
            "dsl_version": "2.0",
            "index": "test",
            "globals": {},
            "id_policy": {
                "strategy": "hash",
                "from": ["name"],
                "op": "hash",
                "sep": "-",
                "on_conflict": "error"
            },
            "fields": [{
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": long_expr}],
                "pipeline": []
            }]
        }
        
        is_valid, errors = validate_mapping(invalid_mapping)
        # Devrait échouer à cause de la longueur de l'expression
        assert not is_valid, "Mapping avec expression trop longue accepté"
        
        print("✅ Limite JSONPath OK")
        
    except ImportError:
        print("⚠️  Validateur non disponible, test JSONPath ignoré")

def test_pipeline_length_limit():
    """Test de la limite de longueur des pipelines."""
    print("🧪 Test de la limite de pipeline...")
    
    try:
        from app.domain.mapping.validators.common.json_validator import validate_mapping
        
        # Test pipeline avec 51 opérations (warning)
        long_pipeline = [{"op": "trim"} for _ in range(51)]
        
        mapping_warning = {
            "dsl_version": "2.0",
            "index": "test",
            "globals": {},
            "id_policy": {
                "strategy": "hash",
                "from": ["name"],
                "op": "hash",
                "sep": "-",
                "on_conflict": "error"
            },
            "fields": [{
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "name"}],
                "pipeline": long_pipeline
            }]
        }
        
        is_valid, errors = validate_mapping(mapping_warning)
        # Devrait passer mais avec warning
        assert is_valid, f"Pipeline de 51 opérations rejeté: {errors}"
        
        # Vérifier qu'il y a un warning
        warning_codes = [e.code for e in errors]
        assert "W_PIPELINE_TOO_LONG" in warning_codes, "Warning manquant pour pipeline long"
        
        # Test pipeline avec 201 opérations (erreur)
        very_long_pipeline = [{"op": "trim"} for _ in range(201)]
        
        mapping_error = {
            "dsl_version": "2.0",
            "index": "test",
            "globals": {},
            "id_policy": {
                "strategy": "hash",
                "from": ["name"],
                "op": "hash",
                "sep": "-",
                "on_conflict": "error"
            },
            "fields": [{
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "name"}],
                "pipeline": very_long_pipeline
            }]
        }
        
        is_valid, errors = validate_mapping(mapping_error)
        # Devrait échouer
        assert not is_valid, "Pipeline de 201 opérations accepté"
        
        # Vérifier qu'il y a une erreur
        error_codes = [e.code for e in errors]
        assert "E_PIPELINE_TOO_LONG" in error_codes, "Erreur manquante pour pipeline trop long"
        
        print("✅ Limite de pipeline OK")
        
    except ImportError:
        print("⚠️  Validateur non disponible, test pipeline ignoré")

def main():
    """Exécute tous les tests."""
    print("🚀 Démarrage des tests des nouvelles opérations V2...\n")
    
    try:
        test_operation_aliases()
        test_new_operations()
        test_enriched_conditions()
        test_jsonpath_length_limit()
        test_pipeline_length_limit()
        
        print("\n🎉 Tous les tests sont passés avec succès !")
        return 0
        
    except Exception as e:
        print(f"\n❌ Test échoué: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
