#!/usr/bin/env python3
"""Import simplifié du dashboard Grafana V2.1."""

import requests
import json
import os
import base64

GRAFANA_URL = "http://localhost:3000"
GRAFANA_USER = "admin"
GRAFANA_PASS = "admin"

def import_dashboard_simple():
    """Importe le dashboard V2.1 avec authentification basique."""
    print("📊 Import Dashboard Grafana V2.1 (Méthode simplifiée)")
    print("=" * 60)
    
    # 1. Authentification basique
    print("🔐 Authentification basique...")
    credentials = f"{GRAFANA_USER}:{GRAFANA_PASS}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/json"
    }
    
    # 2. Vérifier la connexion
    try:
        response = requests.get(f"{GRAFANA_URL}/api/health", headers=headers)
        if response.status_code == 200:
            print("✅ Connexion Grafana réussie")
        else:
            print(f"⚠️ Connexion Grafana: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Erreur connexion: {e}")
    
    # 3. Charger le dashboard
    print("\n📋 Chargement du dashboard...")
    dashboard_path = os.path.join(os.path.dirname(__file__), "grafana_dashboard_v21.json")
    
    try:
        with open(dashboard_path, 'r') as f:
            dashboard_data = json.load(f)
        print("✅ Dashboard chargé")
    except Exception as e:
        print(f"❌ Erreur chargement dashboard: {e}")
        return False
    
    # 4. Créer la source de données Prometheus
    print("\n🔌 Création source de données Prometheus...")
    datasource_config = {
        "name": "Prometheus",
        "type": "prometheus",
        "url": "http://prometheus:9090",
        "access": "proxy",
        "isDefault": True
    }
    
    try:
        response = requests.post(
            f"{GRAFANA_URL}/api/datasources",
            json=datasource_config,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Source Prometheus créée")
        elif response.status_code == 409:
            print("✅ Source Prometheus existe déjà")
        else:
            print(f"⚠️ Source Prometheus: {response.status_code}")
            print(f"   Réponse: {response.text}")
    except Exception as e:
        print(f"⚠️ Erreur source Prometheus: {e}")
    
    # 5. Importer le dashboard
    print("\n🚀 Import du dashboard...")
    
    # Préparer les données d'import
    import_data = {
        "dashboard": dashboard_data["dashboard"],
        "overwrite": True,
        "inputs": [
            {
                "name": "DS_PROMETHEUS",
                "type": "datasource",
                "pluginId": "prometheus",
                "value": "Prometheus"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{GRAFANA_URL}/api/dashboards/import",
            json=import_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            dashboard_id = result.get("id", "N/A")
            dashboard_url = result.get("url", "N/A")
            
            print("✅ Dashboard importé avec succès !")
            print(f"  📊 ID: {dashboard_id}")
            print(f"  🌐 URL: {GRAFANA_URL}{dashboard_url}")
            
            # 6. Vérification
            print("\n🔍 Vérification...")
            try:
                response = requests.get(
                    f"{GRAFANA_URL}/api/dashboards/uid/{result.get('uid', '')}",
                    headers=headers
                )
                if response.status_code == 200:
                    print("✅ Dashboard accessible via API")
                else:
                    print(f"⚠️ Dashboard créé mais non accessible via API: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Erreur vérification: {e}")
            
            return True
            
        else:
            print(f"❌ Échec import: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de l'import: {e}")
        return False

def test_grafana_access():
    """Test d'accès à Grafana."""
    print("🔍 Test d'accès à Grafana...")
    
    try:
        # Test sans authentification
        response = requests.get(f"{GRAFANA_URL}/api/health")
        print(f"  Sans auth: {response.status_code}")
        
        # Test avec authentification basique
        credentials = f"{GRAFANA_USER}:{GRAFANA_PASS}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {"Authorization": f"Basic {encoded_credentials}"}
        
        response = requests.get(f"{GRAFANA_URL}/api/health", headers=headers)
        print(f"  Avec auth: {response.status_code}")
        
        if response.status_code == 200:
            print("  ✅ Accès authentifié réussi")
            return True
        else:
            print("  ❌ Accès authentifié échoué")
            return False
            
    except Exception as e:
        print(f"  ❌ Erreur test: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Import Dashboard Grafana V2.1")
    print("=" * 60)
    
    try:
        # 1. Test d'accès
        if not test_grafana_access():
            print("❌ Impossible d'accéder à Grafana")
            exit(1)
        
        # 2. Import du dashboard
        success = import_dashboard_simple()
        
        if success:
            print("\n🎉 Dashboard V2.1 importé avec succès !")
            print("📊 Accédez à Grafana pour visualiser les métriques V2.1")
            print(f"🌐 URL: {GRAFANA_URL}")
            print("👤 Login: admin / admin")
        else:
            print("\n❌ Échec de l'import du dashboard")
            
    except Exception as e:
        print(f"\n❌ Erreur lors de l'import: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n⏰ Import terminé")
