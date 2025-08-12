#!/usr/bin/env python3
"""Test de debug pour l'opération flatten."""

import json
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.domain.mapping.executor.executor import _apply_compiled

def test_flatten_debug():
    """Test de debug pour flatten."""
    
    print("🔍 Debug de l'opération flatten")
    print("=" * 50)
    
    # Test direct de flatten
    globals_cfg = {}
    dictionaries = {}
    field = "test"
    row_idx = 0
    issues = []
    
    # Test 1: [[1, 2], [3]]
    input_data = [[1, 2], [3]]
    print(f"\n1️⃣ Input: {input_data}")
    print(f"Type: {type(input_data)}")
    
    plan = [
        ("flatten", {}, {"op": "flatten"}),
        ("join", {"sep": ","}, {"op": "join", "sep": ","})
    ]
    
    result = _apply_compiled(globals_cfg, dictionaries, input_data, plan, field, row_idx, issues)
    print(f"Result: {result}")
    print(f"Issues: {issues}")
    
    # Test 2: étape par étape
    print(f"\n2️⃣ Test étape par étape:")
    print(f"Input: {input_data}")
    
    # Étape 1: flatten
    plan1 = [("flatten", {}, {"op": "flatten"})]
    result1 = _apply_compiled(globals_cfg, dictionaries, input_data, plan1, field, row_idx, issues)
    print(f"Après flatten: {result1}")
    
    # Étape 2: join
    plan2 = [("join", {"sep": ","}, {"op": "join", "sep": ","})]
    result2 = _apply_compiled(globals_cfg, dictionaries, result1, plan2, field, row_idx, issues)
    print(f"Après join: {result2}")

if __name__ == "__main__":
    test_flatten_debug()
