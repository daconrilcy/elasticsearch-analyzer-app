#!/usr/bin/env python3
"""
Test complet de l'API V2 avec authentification - Utilisateur test/test
"""

import requests
import json

def get_auth_token():
    """Récupère un token d'authentification pour l'utilisateur test."""
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            json={
                "username": "test",
                "password": "test"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            # Le token est dans le cookie
            cookies = response.cookies
            token_cookie = cookies.get('access_token')
            
            if token_cookie:
                # Le cookie contient "Bearer <token>" avec des guillemets
                if token_cookie.startswith('"Bearer '):
                    token = token_cookie[8:-1]  # Enlever "Bearer " et le dernier "
                    print(f"✅ Token récupéré: {token[:20]}...")
                    return token
                else:
                    print(f"⚠️  Format de cookie inattendu: {token_cookie[:50]}...")
                    return None
            else:
                print("❌ Aucun cookie access_token trouvé")
                return None
        else:
            print(f"❌ Échec de connexion: {response.status_code}")
            print(f"Réponse: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Erreur lors de la connexion: {e}")
        return None

def test_mapping_v2_validation():
    """Test de validation d'un mapping V2."""
    print("🧪 Test de validation V2...")
    
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
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            },
            {
                "target": "tags_length",
                "type": "long",
                "input": [{"kind": "jsonpath", "expr": "$.tags"}],
                "pipeline": [
                    {"op": "map", "then": [{"op": "length"}]}
                ]
            }
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/validate/test",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Validation réussie!")
            print(f"Erreurs: {len(result.get('errors', []))}")
            print(f"Warnings: {len(result.get('warnings', []))}")
            
            if result.get('errors'):
                print("❌ Erreurs détectées:")
                for error in result['errors']:
                    print(f"  - {error}")
            
            if result.get('warnings'):
                print("⚠️  Warnings détectés:")
                for warning in result['warnings']:
                    print(f"  - {warning}")
            
            return len(result.get('errors', [])) == 0
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_mapping_v2_compile():
    """Test de compilation d'un mapping V2."""
    print("\n🧪 Test de compilation V2...")
    
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
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/compile/test",
            json=mapping_v2,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Compilation réussie!")
            print(f"Mapping ES généré: {result.get('mappings') is not None}")
            
            if result.get('mappings') and result.get('mappings', {}).get('properties'):
                print("✅ Mapping Elasticsearch généré avec succès!")
                print(f"  - {len(result['mappings']['properties'])} propriétés générées")
                return True
            else:
                print("⚠️  Aucun mapping ES généré")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_mapping_v2_dry_run(auth_token):
    """Test de dry-run d'un mapping V2 avec authentification."""
    print("\n🧪 Test de dry-run V2 (avec authentification)...")
    
    if not auth_token:
        print("❌ Pas de token d'authentification disponible")
        return False
    
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
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            },
            {
                "target": "tags_length",
                "type": "long",
                "input": [{"kind": "jsonpath", "expr": "$.tags"}],
                "pipeline": [
                    {"op": "map", "then": [{"op": "length"}]}
                ]
            }
        ],
        "rows": [
            {
                "id": "1",
                "full_name": "  John DOE  ",
                "tags": ["developer", "python", "elasticsearch"]
            }
        ]
    }
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/dry-run",
            json=mapping_v2,
            headers=headers,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Dry-run réussi!")
            print(f"Documents générés: {len(result.get('docs_preview', []))}")
            print(f"Issues: {len(result.get('issues', []))}")
            
            # Vérifier le résultat
            if result.get('docs_preview'):
                doc = result['docs_preview'][0]['_source']
                print(f"📄 Document généré:")
                print(f"  name: {doc.get('name')}")
                print(f"  tags_length: {doc.get('tags_length')}")
                
                # Vérifications
                if doc.get('name') == "John DOE" and doc.get('tags_length') == [9, 6, 13]:
                    print("✅ Résultats du dry-run corrects!")
                    return True
                else:
                    print("❌ Résultats du dry-run incorrects")
                    return False
            else:
                print("❌ Aucun document généré")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_mapping_v2_compile_with_auth(auth_token):
    """Test de compilation V2 avec authentification."""
    print("\n🧪 Test de compilation V2 (avec authentification)...")
    
    if not auth_token:
        print("❌ Pas de token d'authentification disponible")
        return False
    
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
        "containers": [
            {"path": "contacts[]", "type": "nested"}
        ],
        "fields": [
            {
                "target": "name",
                "type": "keyword",
                "input": [{"kind": "column", "name": "full_name"}],
                "pipeline": [{"op": "trim"}]
            }
        ]
    }
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            "http://localhost:8000/api/v1/mappings/compile",
            json=mapping_v2,
            headers=headers,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Compilation avec auth réussie!")
            print(f"Mapping ES généré: {result.get('mappings') is not None}")
            
            if result.get('mappings') and result.get('mappings', {}).get('properties'):
                print("✅ Mapping Elasticsearch généré avec succès!")
                print(f"  - {len(result['mappings']['properties'])} propriétés générées")
                return True
            else:
                print("⚠️  Aucun mapping ES généré")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def main():
    """Exécute tous les tests V2 avec authentification."""
    print("🚀 Test complet de l'API V2 avec authentification")
    print("=" * 60)
    
    # 1. Connexion et récupération du token
    print("🔐 Connexion avec l'utilisateur test...")
    auth_token = get_auth_token()
    
    if not auth_token:
        print("❌ Impossible de se connecter. Arrêt des tests.")
        return 1
    
    print("✅ Connexion réussie!")
    
    # 2. Tests des endpoints
    results = []
    
    # Test 1: Validation (sans auth)
    results.append(("Validation V2", test_mapping_v2_validation()))
    
    # Test 2: Compilation (sans auth)
    results.append(("Compilation V2", test_mapping_v2_compile()))
    
    # Test 3: Compilation avec auth
    results.append(("Compilation V2 (auth)", test_mapping_v2_compile_with_auth(auth_token)))
    
    # Test 4: Dry-run avec auth
    results.append(("Dry-run V2 (auth)", test_mapping_v2_dry_run(auth_token)))
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS V2")
    print("=" * 60)
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:25} : {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Total: {len(results)} tests")
    print(f"✅ Succès: {passed}")
    print(f"❌ Échecs: {len(results) - passed}")
    print(f"📈 Taux de succès: {(passed/len(results)*100):.1f}%")
    
    if passed == len(results):
        print("\n🎉 Tous les tests V2 sont passés ! La V2 est prête pour la production !")
        return 0
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit(main())
