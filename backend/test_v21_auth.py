#!/usr/bin/env python3
"""Test authentifié des fonctionnalités V2.1 et endpoint apply."""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_auth_session():
    """Obtient une session authentifiée avec cookies et token."""
    print("🔐 Authentification...")
    
    # Login avec l'utilisateur test
    login_data = {
        "username": "test",
        "password": "test"
    }
    
    try:
        # Créer une session pour maintenir les cookies
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        
        if response.status_code == 200:
            # Vérifier que le cookie est présent
            if "access_token" in session.cookies:
                # Extraire le token du cookie pour l'utiliser dans les headers
                token = session.cookies["access_token"]
                print(f"   Cookie brut: {repr(token)}")
                
                # Nettoyer les guillemets et retours à la ligne
                token = token.strip('"').replace('\n', '').replace('\r', '')
                
                # Le cookie contient "Bearer {token}", on extrait juste le token
                if token.startswith("Bearer "):
                    token = token[7:]  # Enlever "Bearer "
                
                # Ajouter le token aux headers de la session
                session.headers.update({"Authorization": f"Bearer {token}"})
                
                print("✅ Authentification réussie")
                print(f"   Token extrait: {token[:20]}...")
                return session
            else:
                print("❌ Cookie access_token non trouvé")
                return None
        else:
            print(f"❌ Échec de l'authentification: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur lors de l'authentification: {e}")
        return None

def test_apply_endpoint(session):
    """Test de l'endpoint /apply avec authentification."""
    print("🧪 Test endpoint /apply authentifié...")
    
    # Test mapping V2.1 avec ILM + Ingest
    mapping = {
        "dsl_version": "2.1",
        "index": "test_apply_v21_auth",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "fields": [
            {"target": "name", "type": "keyword", "input": [{"kind": "jsonpath", "expr": "$.name"}]},
            {"target": "age", "type": "integer", "input": [{"kind": "jsonpath", "expr": "$.age"}]},
            {"target": "created_at", "type": "date", "input": [{"kind": "jsonpath", "expr": "$.created_at"}]}
        ]
    }
    
    # Test compilation pour vérifier ILM + Ingest
    print("  📊 Compilation du mapping...")
    response = session.post(f"{BASE_URL}/api/v1/mappings/compile", json=mapping)
    
    if response.status_code == 200:
        result = response.json()
        print(f"    ✅ Compilation réussie")
        print(f"    ILM Policy: {result.get('ilm_policy', {}).get('name', 'N/A')}")
        print(f"    Ingest Pipeline: {result.get('ingest_pipeline', {}).get('name', 'N/A')}")
        print(f"    Settings: {bool(result.get('settings', {}))}")
        print(f"    Mappings: {bool(result.get('mappings', {}))}")
    else:
        print(f"    ❌ Échec de la compilation: {response.status_code}")
        print(f"       Réponse: {response.text}")
        return False
    
    # Test de l'endpoint /apply
    print("  📊 Test de l'endpoint /apply...")
    try:
        response = session.post(f"{BASE_URL}/api/v1/mappings/apply", json=mapping)
        print(f"    Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"    ✅ Apply réussi")
            print(f"    Message: {result.get('message', 'N/A')}")
            
            # Vérifier les résultats par ressource
            results = result.get('results', {})
            for resource, status_info in results.items():
                status = status_info.get('status', 'unknown')
                if status == 'ok':
                    print(f"      {resource}: ✅ OK")
                else:
                    print(f"      {resource}: ❌ Erreur - {status_info.get('error', 'N/A')}")
            
            return True
        else:
            print(f"    ❌ Échec de l'apply: {response.status_code}")
            print(f"       Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"    ❌ Erreur lors de l'apply: {e}")
        return False

def test_zip_objectify_auth(session):
    """Test des opérations zip/objectify avec authentification."""
    print("🧪 Test zip/objectify authentifié...")
    
    mapping = {
        "dsl_version": "2.1",
        "index": "test_zip_objectify_auth",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "containers": [{"path": "pairs[]", "type": "nested"}],
        "fields": [
            {"target": "pairs", "type": "nested", "input": [{"kind": "jsonpath", "expr": "$.a[*]"}], "pipeline": [{"op": "zip", "with": [{"kind": "jsonpath", "expr": "$.b[*]"}]}, {"op": "objectify", "fields": {"left": {"kind": "literal", "value": None}, "right": {"kind": "literal", "value": None}}}]}
        ]
    }
    
    rows = [{"a": [1, 2, 3], "b": [10, 20]}]
    
    # Test dry-run avec authentification
    print("  📊 Test dry-run zip/objectify...")
    
    try:
        response = session.post(f"{BASE_URL}/api/v1/mappings/dry-run", json={"rows": rows, **mapping})
        print(f"    Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            docs = result.get('docs_preview', [])
            if docs:
                doc = docs[0].get('_source', {})
                pairs = doc.get('pairs', [])
                print(f"    ✅ Dry-run réussi")
                print(f"    Nombre de paires: {len(pairs)}")
                if pairs:
                    print(f"    Première paire: {pairs[0]}")
                return True
            else:
                print(f"    ⚠️ Aucun document généré")
                return False
        else:
            print(f"    ❌ Échec du dry-run: {response.status_code}")
            print(f"       Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"    ❌ Erreur lors du dry-run: {e}")
        return False

def test_metrics_with_auth(session):
    """Test des métriques avec authentification."""
    print("🧪 Test des métriques authentifiées...")
    
    # Test compilation pour incrémenter les métriques
    mapping = {
        "dsl_version": "2.1",
        "index": "test_metrics_auth",
        "globals": {"nulls": [], "bool_true": [], "bool_false": [], "decimal_sep": ",", "thousands_sep": " ", "date_formats": [], "default_tz": "Europe/Paris", "empty_as_null": True},
        "id_policy": {"from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"},
        "fields": [
            {"target": "test_field", "type": "keyword", "input": [{"kind": "literal", "value": "test"}]}
        ]
    }
    
    # Compilation multiple pour tester les métriques
    print("  📊 Compilation multiple pour métriques...")
    for i in range(3):
        try:
            response = session.post(f"{BASE_URL}/api/v1/mappings/compile", json=mapping)
            if response.status_code == 200:
                print(f"    Compilation {i+1}: ✅")
            else:
                print(f"    Compilation {i+1}: ❌ {response.status_code}")
        except Exception as e:
            print(f"    Compilation {i+1}: ❌ Erreur - {e}")
    
    # Vérifier les métriques
    print("  📊 Vérification des métriques...")
    try:
        response = requests.get(f"{BASE_URL}/metrics")
        if response.status_code == 200:
            metrics = response.text
            compile_count = 'mapping_compile_calls_total' in metrics
            apply_metrics = 'mapping_apply_success_total' in metrics and 'mapping_apply_fail_total' in metrics
            
            print(f"    Métriques compile: {'✅' if compile_count else '❌'}")
            print(f"    Métriques apply: {'✅' if apply_metrics else '❌'}")
            
            if compile_count:
                # Extraire la valeur actuelle
                for line in metrics.split('\n'):
                    if 'mapping_compile_calls_total' in line and not line.startswith('#'):
                        print(f"    Valeur actuelle: {line.strip()}")
                        break
            
            return True
        else:
            print(f"    ❌ Impossible d'accéder aux métriques: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"    ❌ Erreur lors de la vérification des métriques: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test authentifié des fonctionnalités V2.1")
    print("=" * 60)
    
    try:
        # 1. Authentification
        session = get_auth_session()
        if not session:
            print("❌ Impossible de continuer sans authentification")
            exit(1)
        
        print()
        
        # 2. Test endpoint /apply
        success_apply = test_apply_endpoint(session)
        print()
        
        # 3. Test zip/objectify
        success_zip = test_zip_objectify_auth(session)
        print()
        
        # 4. Test métriques
        success_metrics = test_metrics_with_auth(session)
        print()
        
        # Résumé
        print("📊 Résumé des tests authentifiés:")
        print(f"  Endpoint /apply: {'✅' if success_apply else '❌'}")
        print(f"  Zip/Objectify: {'✅' if success_zip else '❌'}")
        print(f"  Métriques: {'✅' if success_metrics else '❌'}")
        
        if all([success_apply, success_zip, success_metrics]):
            print("\n🎉 Tous les tests authentifiés V2.1 sont passés !")
        else:
            print("\n⚠️ Certains tests ont échoué")
            
    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
