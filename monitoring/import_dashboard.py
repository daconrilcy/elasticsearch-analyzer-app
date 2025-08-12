#!/usr/bin/env python3
"""Import automatique du dashboard Grafana V2.1."""

import requests
import json
import os

GRAFANA_URL = "http://localhost:3000"
GRAFANA_USER = "admin"
GRAFANA_PASS = "admin"

def import_dashboard():
    """Importe le dashboard V2.1 dans Grafana."""
    print("📊 Import du Dashboard Grafana V2.1")
    print("=" * 50)
    
    # 1. Authentification Grafana
    print("🔐 Authentification Grafana...")
    try:
        response = requests.post(f"{GRAFANA_URL}/api/auth/keys", 
                               json={"name": "import_script", "role": "Admin"})
        if response.status_code == 200:
            api_key = response.json()["key"]
            headers = {"Authorization": f"Bearer {api_key}"}
            print("✅ Authentification réussie")
        else:
            # Fallback: login classique
            login_data = {"user": GRAFANA_USER, "password": GRAFANA_PASS}
            response = requests.post(f"{GRAFANA_URL}/login", data=login_data)
            if response.status_code == 200:
                cookies = response.cookies
                headers = {"Cookie": "; ".join([f"{k}={v}" for k, v in cookies.items()])}
                print("✅ Login classique réussi")
            else:
                print(f"❌ Échec authentification: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Erreur authentification: {e}")
        return False
    
    # 2. Chargement du dashboard
    print("\n📋 Chargement du dashboard...")
    dashboard_path = os.path.join(os.path.dirname(__file__), "grafana_dashboard_v21.json")
    
    try:
        with open(dashboard_path, 'r') as f:
            dashboard_data = json.load(f)
        
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
        
        print("✅ Dashboard chargé")
        
    except Exception as e:
        print(f"❌ Erreur chargement dashboard: {e}")
        return False
    
    # 3. Import du dashboard
    print("\n🚀 Import du dashboard...")
    try:
        response = requests.post(f"{GRAFANA_URL}/api/dashboards/import", 
                               json=import_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            dashboard_id = result["id"]
            dashboard_url = result["url"]
            
            print("✅ Dashboard importé avec succès !")
            print(f"  ID: {dashboard_id}")
            print(f"  URL: {GRAFANA_URL}{dashboard_url}")
            
            # 4. Vérification
            print("\n🔍 Vérification...")
            response = requests.get(f"{GRAFANA_URL}/api/dashboards/uid/{result['uid']}", 
                                  headers=headers)
            if response.status_code == 200:
                print("✅ Dashboard accessible via API")
                return True
            else:
                print(f"⚠️ Dashboard créé mais non accessible via API: {response.status_code}")
                return True
                
        else:
            print(f"❌ Échec import: {response.status_code}")
            print(f"  Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de l'import: {e}")
        return False

def create_datasource():
    """Crée la source de données Prometheus si elle n'existe pas."""
    print("\n🔌 Vérification source de données Prometheus...")
    
    try:
        # Vérifier si Prometheus existe déjà
        response = requests.get(f"{GRAFANA_URL}/api/datasources/name/Prometheus")
        if response.status_code == 200:
            print("✅ Source Prometheus déjà configurée")
            return True
        
        # Créer la source Prometheus
        datasource_config = {
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://prometheus:9090",
            "access": "proxy",
            "isDefault": True
        }
        
        response = requests.post(f"{GRAFANA_URL}/api/datasources", 
                               json=datasource_config)
        
        if response.status_code == 200:
            print("✅ Source Prometheus créée")
            return True
        else:
            print(f"⚠️ Impossible de créer la source Prometheus: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"⚠️ Erreur vérification source de données: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Import Dashboard Grafana V2.1")
    print("=" * 60)
    
    try:
        # 1. Créer la source de données
        create_datasource()
        
        # 2. Importer le dashboard
        success = import_dashboard()
        
        if success:
            print("\n🎉 Dashboard V2.1 importé avec succès !")
            print("📊 Accédez à Grafana pour visualiser les métriques V2.1")
        else:
            print("\n❌ Échec de l'import du dashboard")
            
    except Exception as e:
        print(f"\n❌ Erreur lors de l'import: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n⏰ Import terminé")
