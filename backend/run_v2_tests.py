#!/usr/bin/env python3
"""Script d'exécution des tests V2 complets."""

import sys
import os
import subprocess
import time

def run_tests():
    """Exécute tous les tests V2."""
    
    print("🚀 Lancement des tests V2 complets")
    print("=" * 60)
    
    # Tests à exécuter
    test_files = [
        "tests/api/v1/test_mappings_v2.py",
        "tests/performance/test_v2_performance.py",
        "tests/regression/test_v1_compatibility.py"
    ]
    
    results = {}
    total_tests = 0
    passed_tests = 0
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"\n📋 Exécution de {test_file}")
            print("-" * 40)
            
            try:
                # Exécuter le test avec pytest
                start_time = time.time()
                result = subprocess.run([
                    sys.executable, "-m", "pytest", test_file, "-v", "--tb=short"
                ], capture_output=True, text=True, timeout=300)
                end_time = time.time()
                
                execution_time = end_time - start_time
                
                if result.returncode == 0:
                    print(f"✅ {test_file} - SUCCÈS ({execution_time:.2f}s)")
                    results[test_file] = {
                        "status": "SUCCESS",
                        "time": execution_time,
                        "output": result.stdout
                    }
                    passed_tests += 1
                else:
                    print(f"❌ {test_file} - ÉCHEC ({execution_time:.2f}s)")
                    print(f"Erreur: {result.stderr}")
                    results[test_file] = {
                        "status": "FAILURE",
                        "time": execution_time,
                        "error": result.stderr,
                        "output": result.stdout
                    }
                
                total_tests += 1
                
            except subprocess.TimeoutExpired:
                print(f"⏰ {test_file} - TIMEOUT (>5min)")
                results[test_file] = {
                    "status": "TIMEOUT",
                    "time": 300,
                    "error": "Test timeout après 5 minutes"
                }
                total_tests += 1
                
            except Exception as e:
                print(f"💥 {test_file} - ERREUR: {e}")
                results[test_file] = {
                    "status": "ERROR",
                    "time": 0,
                    "error": str(e)
                }
                total_tests += 1
        else:
            print(f"⚠️  {test_file} - FICHIER NON TROUVÉ")
    
    # Résumé des résultats
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    for test_file, result in results.items():
        status_icon = {
            "SUCCESS": "✅",
            "FAILURE": "❌",
            "TIMEOUT": "⏰",
            "ERROR": "💥"
        }.get(result["status"], "❓")
        
        print(f"{status_icon} {test_file}: {result['status']} ({result['time']:.2f}s)")
    
    print(f"\n🎯 Total: {total_tests} tests")
    print(f"✅ Succès: {passed_tests}")
    print(f"❌ Échecs: {total_tests - passed_tests}")
    
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"📈 Taux de succès: {success_rate:.1f}%")
    
    # Retourner le code de sortie approprié
    if passed_tests == total_tests:
        print("\n🎉 Tous les tests ont réussi !")
        return 0
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test(s) ont échoué")
        return 1

def run_simple_tests():
    """Exécute des tests simples sans pytest."""
    
    print("🧪 Tests simples V2")
    print("=" * 40)
    
    # Test de l'exécuteur V2
    try:
        from app.domain.mapping.executor.executor import run_dry_run
        
        # Test simple
        mapping = {
            "dsl_version": "2.0",
            "index": "test",
            "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
            "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
            "containers": [{"path": "contacts[]", "type": "nested"}],
            "fields": [{
                "target": "contacts.phone",
                "type": "keyword",
                "input": [{"kind": "jsonpath", "expr": "$.contacts[*].phone"}],
                "pipeline": [{"op": "map", "then": [{"op": "trim"}]}]
            }]
        }
        
        rows = [{"contacts": [{"phone": " 01 "}, {"phone": "02"}]}]
        
        result = run_dry_run(mapping, rows)
        
        if result and "docs_preview" in result:
            print("✅ Exécuteur V2 fonctionne")
            return True
        else:
            print("❌ Exécuteur V2 échoue")
            return False
            
    except Exception as e:
        print(f"❌ Erreur dans l'exécuteur V2: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Vérification de l'environnement...")
    
    # Vérifier que nous sommes dans le bon répertoire
    if not os.path.exists("app"):
        print("❌ Erreur: Répertoire 'app' non trouvé")
        print("   Assurez-vous d'être dans le répertoire backend")
        sys.exit(1)
    
    # Essayer d'abord les tests simples
    print("\n1️⃣ Tests simples...")
    simple_success = run_simple_tests()
    
    if simple_success:
        print("\n2️⃣ Tests complets...")
        exit_code = run_tests()
        sys.exit(exit_code)
    else:
        print("\n❌ Les tests simples ont échoué, arrêt")
        sys.exit(1)
