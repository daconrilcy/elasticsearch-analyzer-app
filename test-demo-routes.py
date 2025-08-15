#!/usr/bin/env python3
"""
🧪 Script de Test - Routes de Démonstration
Teste les nouveaux endpoints de démonstration du backend
"""

import requests
import json
import sys
from datetime import datetime

def test_demo_routes():
    """Teste toutes les routes de démonstration"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Test des Routes de Démonstration")
    print("=" * 50)
    print(f"URL de base : {base_url}")
    print(f"Timestamp : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Routes à tester (avec le nouveau préfixe /api/v1/demo)
    routes = [
        {
            "name": "Demo Principal",
            "url": "/api/v1/demo",
            "method": "GET",
            "description": "Informations générales sur le workbench de démonstration"
        },
        {
            "name": "Demo Workbench",
            "url": "/api/v1/demo/workbench",
            "method": "GET",
            "description": "Informations spécifiques au workbench"
        },
        {
            "name": "Demo Studio",
            "url": "/api/v1/demo/studio",
            "method": "GET",
            "description": "Informations spécifiques au studio"
        },
        {
            "name": "Demo Status",
            "url": "/api/v1/demo/status",
            "method": "GET",
            "description": "Statut et métriques du système de démonstration"
        },
        {
            "name": "Demo Help",
            "url": "/api/v1/demo/help",
            "method": "GET",
            "description": "Guide d'aide et ressources pour la démonstration"
        }
    ]
    
    results = []
    
    for route in routes:
        print(f"🔍 Test de : {route['name']}")
        print(f"   URL : {route['url']}")
        print(f"   Description : {route['description']}")
        
        try:
            response = requests.get(f"{base_url}{route['url']}", timeout=10)
            
            if response.status_code == 200:
                print("   ✅ Statut : 200 OK")
                
                # Afficher la réponse
                try:
                    data = response.json()
                    print("   📊 Réponse :")
                    print(f"      Message : {data.get('message', 'N/A')}")
                    
                    if 'features' in data:
                        if isinstance(data['features'], list):
                            print(f"      Fonctionnalités : {len(data['features'])} trouvées")
                        elif isinstance(data['features'], dict):
                            print(f"      Fonctionnalités : {len(data['features'])} catégories")
                    
                    if 'url' in data:
                        print(f"      URL Frontend : {data['url']}")
                        
                    if 'status' in data:
                        print(f"      Statut : {data['status']}")
                        
                    if 'version' in data:
                        print(f"      Version : {data['version']}")
                        
                except json.JSONDecodeError:
                    print("   ⚠️  Réponse non-JSON reçue")
                    print(f"      Contenu : {response.text[:200]}...")
                
                results.append({
                    "route": route['name'],
                    "status": "SUCCESS",
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                })
                
            else:
                print(f"   ❌ Statut : {response.status_code}")
                print(f"      Erreur : {response.text}")
                results.append({
                    "route": route['name'],
                    "status": "ERROR",
                    "status_code": response.status_code,
                    "error": response.text
                })
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Erreur : Impossible de se connecter au serveur")
            print("      Vérifiez que le backend est démarré sur http://localhost:8000")
            results.append({
                "route": route['name'],
                "status": "CONNECTION_ERROR",
                "error": "Serveur non accessible"
            })
            
        except requests.exceptions.Timeout:
            print("   ❌ Erreur : Timeout de la requête")
            results.append({
                "route": route['name'],
                "status": "TIMEOUT",
                "error": "Requête expirée"
            })
            
        except Exception as e:
            print(f"   ❌ Erreur inattendue : {e}")
            results.append({
                "route": route['name'],
                "status": "UNEXPECTED_ERROR",
                "error": str(e)
            })
        
        print()
    
    # Résumé des tests
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 50)
    
    success_count = sum(1 for r in results if r['status'] == 'SUCCESS')
    total_count = len(results)
    
    print(f"Total des routes testées : {total_count}")
    print(f"✅ Succès : {success_count}")
    print(f"❌ Échecs : {total_count - success_count}")
    print()
    
    for result in results:
        status_icon = "✅" if result['status'] == 'SUCCESS' else "❌"
        print(f"{status_icon} {result['route']} : {result['status']}")
        
        if result['status'] == 'SUCCESS':
            print(f"   Temps de réponse : {result['response_time']:.3f}s")
        elif 'error' in result:
            print(f"   Erreur : {result['error']}")
    
    print()
    
    if success_count == total_count:
        print("🎉 Tous les tests sont passés avec succès !")
        print("🚀 Le workbench de démonstration est accessible via :")
        print("   - http://localhost:8000/api/v1/demo")
        print("   - http://localhost:8000/api/v1/demo/workbench")
        print("   - http://localhost:8000/api/v1/demo/studio")
        print("   - http://localhost:8000/api/v1/demo/status")
        print("   - http://localhost:8000/api/v1/demo/help")
        return 0
    else:
        print("⚠️  Certains tests ont échoué.")
        print("🔧 Vérifiez la configuration du backend et redémarrez si nécessaire.")
        return 1

def main():
    """Fonction principale"""
    print("🚀 Démarrage des tests de démonstration...")
    print()
    
    try:
        exit_code = test_demo_routes()
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print("\n\n❌ Tests interrompus par l'utilisateur")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
