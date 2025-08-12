#!/usr/bin/env python3
"""Test simple de connexion"""

import requests

def test_login():
    """Test de connexion avec l'utilisateur test."""
    try:
        print("🔐 Test de connexion...")
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            json={
                "username": "test",
                "password": "test"
            },
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Réponse: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Connexion réussie!")
            print(f"Token: {data.get('access_token', 'N/A')[:20]}...")
        else:
            print(f"❌ Échec de connexion")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    test_login()
