#!/usr/bin/env python3
"""Test de debug de l'exécuteur V2."""

import json
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.domain.mapping.executor.executor import _get_input_values, _compile_pipeline, _apply_compiled

def test_debug():
    """Test de debug étape par étape."""
    
    # Données de test
    row = {
        "id": "user1",
        "contacts": [
            {"phone": " 01 "},
            {"phone": "02"}
        ],
        "tags": ["foo", "bar", "baz"]
    }
    
    print("🔍 Debug étape par étape")
    print("=" * 50)
    
    # Test 1: _get_input_values
    print("\n1️⃣ Test _get_input_values:")
    inputs = [
        {"kind": "jsonpath", "expr": "$.tags[*]"}
    ]
    values = _get_input_values(row, inputs)
    print(f"Inputs: {inputs}")
    print(f"Values: {values}")
    print(f"Type: {type(values[0])}")
    print(f"Length: {len(values[0]) if values[0] else 'None'}")
    
    # Test 2: _compile_pipeline
    print("\n2️⃣ Test _compile_pipeline:")
    pipeline = [
        {"op": "take", "which": "first"}
    ]
    plan = _compile_pipeline(pipeline)
    print(f"Pipeline: {pipeline}")
    print(f"Plan: {plan}")
    
    # Test 3: _apply_compiled
    print("\n3️⃣ Test _apply_compiled:")
    globals_cfg = {}
    dictionaries = {}
    field = "test"
    row_idx = 0
    issues = []
    
    result = _apply_compiled(globals_cfg, dictionaries, values[0], plan, field, row_idx, issues)
    print(f"Input: {values[0]}")
    print(f"Result: {result}")
    print(f"Issues: {issues}")

if __name__ == "__main__":
    test_debug()
