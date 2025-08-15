# 🎨 **Guide du Workbench de Démonstration - Mapping Studio V2.2**

## 📋 **Vue d'ensemble**

Ce guide explique comment accéder et utiliser le workbench de démonstration du Mapping Studio V2.2, une interface avancée pour tester et valider les mappings DSL.

## 🚀 **Accès au Workbench**

### **1. 🔗 Routes Backend Disponibles**

| Route | Description | Réponse |
|-------|-------------|---------|
| **`/api/v1/demo`** | Informations générales sur le workbench | Vue d'ensemble complète |
| **`/api/v1/demo/workbench`** | Détails spécifiques au workbench | Fonctionnalités détaillées |
| **`/api/v1/demo/studio`** | Détails spécifiques au studio | Interface graphique |
| **`/api/v1/demo/status`** | Statut et métriques du système | État des composants |
| **`/api/v1/demo/help`** | Guide d'aide et ressources | Instructions détaillées |

### **2. 🌐 URLs d'Accès**

#### **Backend (API)**
```bash
# Informations générales
curl http://localhost:8000/api/v1/demo

# Détails du workbench
curl http://localhost:8000/api/v1/demo/workbench

# Détails du studio
curl http://localhost:8000/api/v1/demo/studio

# Statut du système
curl http://localhost:8000/api/v1/demo/status

# Aide et ressources
curl http://localhost:8000/api/v1/demo/help
```

#### **Frontend (Interface)**
```bash
# Workbench de démonstration
http://localhost:5173/mappings/demo

# Mode workbench spécifiquement
http://localhost:5173/mappings/demo?mode=workbench

# Mode studio spécifiquement
http://localhost:5173/mappings/demo?mode=studio
```

## 🔧 **Configuration Requise**

### **1. 🐍 Backend Python**
```bash
# Activer l'environnement virtuel
cd backend
# Activer .venv selon votre OS
python main.py
```

### **2. ⚛️ Frontend React**
```bash
# Installer les dépendances
cd frontend
npm install

# Démarrer en mode développement
npm run dev
```

### **3. 🔑 Variables d'Environnement**
```bash
# Créer le fichier .env dans frontend/
VITE_API_BASE=http://localhost:8000
```

## 🎯 **Fonctionnalités du Workbench**

### **1. 🔧 Éditeur Avancé**
- **Coloration syntaxique** pour le DSL de mapping
- **Validation en temps réel** des syntaxes
- **Auto-complétion** intelligente
- **Gestion des erreurs** avec suggestions

### **2. 📊 Visualisation des Données**
- **Aperçu en temps réel** des transformations
- **Graphiques interactifs** des structures
- **Comparaison** avant/après mapping
- **Export** vers différents formats

### **3. 🧪 Tests et Validation**
- **Tests unitaires** des mappings
- **Validation de schéma** JSON
- **Tests d'intégration** avec Elasticsearch
- **Rapports de performance**

### **4. 💾 Gestion des Versions**
- **Sauvegarde automatique** des modifications
- **Historique des versions** avec diff
- **Collaboration** en temps réel
- **Export/Import** des configurations

## 🚀 **Utilisation Pas à Pas**

### **1. 🎬 Démarrage Rapide**
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev

# Navigateur
# Ouvrir http://localhost:5173/mappings/demo
```

### **2. 🔄 Navigation dans l'Interface**

#### **Sélecteur de Mode**
- **🎨 Studio V2.2** : Interface graphique drag & drop
- **🔧 Workbench V2.2** : Éditeur de code avancé

#### **Barre d'Outils**
- **📁 Nouveau** : Créer un mapping vierge
- **💾 Sauvegarder** : Enregistrer les modifications
- **🧪 Tester** : Valider le mapping
- **📤 Exporter** : Générer le code final

### **3. ✍️ Création d'un Mapping**

#### **Éditeur de Code**
```json
{
  "version": "2.2",
  "name": "Mapping de démonstration",
  "description": "Exemple de mapping DSL V2.2",
  "pipeline": [
    {
      "operation": "select",
      "fields": ["id", "name", "email"]
    },
    {
      "operation": "transform",
      "field": "email",
      "to": "email_normalized",
      "function": "lowercase"
    }
  ]
}
```

#### **Validation en Temps Réel**
- ✅ **Syntaxe valide** : Coloration verte
- ⚠️ **Avertissements** : Suggestions d'amélioration
- ❌ **Erreurs** : Messages d'erreur détaillés

### **4. 🧪 Tests et Validation**

#### **Test Unitaire**
```bash
# Tester le mapping
curl -X POST http://localhost:8000/api/v1/mappings/test \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

#### **Validation de Schéma**
```bash
# Valider la structure
curl -X POST http://localhost:8000/api/v1/mappings/validate \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

## 📊 **Exemples de Mappings**

### **1. 🎯 Normalisation de Contacts**
```json
{
  "version": "2.2",
  "name": "Normalisation Contacts",
  "pipeline": [
    {
      "operation": "select",
      "fields": ["contact_id", "full_name", "email", "phone"]
    },
    {
      "operation": "transform",
      "field": "full_name",
      "to": "name_normalized",
      "function": "title_case"
    },
    {
      "operation": "transform",
      "field": "email",
      "to": "email_clean",
      "function": "lowercase"
    },
    {
      "operation": "filter",
      "condition": "email_clean contains '@'"
    }
  ]
}
```

### **2. 🔢 Agrégation de Données**
```json
{
  "version": "2.2",
  "name": "Agrégation Ventes",
  "pipeline": [
    {
      "operation": "group_by",
      "fields": ["product_category", "date_month"]
    },
    {
      "operation": "aggregate",
      "field": "amount",
      "functions": ["sum", "avg", "count"]
    },
    {
      "operation": "sort",
      "field": "amount_sum",
      "order": "desc"
    }
  ]
}
```

## 🔍 **Dépannage**

### **1. ❌ Erreur de Connexion**
```bash
# Vérifier que le backend est démarré
curl http://localhost:8000/health

# Vérifier les variables d'environnement
echo $VITE_API_BASE
```

### **2. ⚠️ Erreurs de Validation**
```bash
# Vérifier la syntaxe du mapping
python -m json.tool mapping.json

# Tester avec l'API de validation
curl -X POST http://localhost:8000/api/v1/mappings/validate \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

### **3. 🐛 Problèmes d'Interface**
```bash
# Vérifier la console du navigateur
# Redémarrer le frontend
cd frontend
npm run dev
```

## 📈 **Métriques et Performance**

### **1. 📊 Temps de Réponse**
- **Validation** : < 100ms
- **Compilation** : < 500ms
- **Tests** : < 1s
- **Export** : < 2s

### **2. 🧪 Qualité des Mappings**
- **Taux de validation** : > 95%
- **Erreurs détectées** : 100%
- **Suggestions** : > 80% pertinentes

## 🔄 **Intégration avec le Workflow**

### **1. 🚀 Développement**
```bash
# Créer un mapping dans le workbench
# Tester et valider
# Exporter vers le projet principal
```

### **2. 🧪 Tests**
```bash
# Intégrer dans la suite de tests
# Valider avec des données réelles
# Mesurer les performances
```

### **3. 📦 Déploiement**
```bash
# Compiler le mapping final
# Déployer vers Elasticsearch
# Monitorer en production
```

## 📚 **Ressources Supplémentaires**

### **1. 🔗 Documentation API**
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

### **2. 📖 Guides Associés**
- **`docs/mapping/README.md`** : Guide du DSL de mapping
- **`docs/CLEANUP_GUIDE.md`** : Nettoyage des fichiers temporaires
- **`docs/STANDARDS.md`** : Standards de documentation

### **3. 🛠️ Outils Utiles**
- **`cleanup-python.py`** : Nettoyage automatique
- **`test-demo-routes.py`** : Tests des routes de démo
- **Scripts de configuration** : `setup-env.bat`, `setup-env.sh`

## ✅ **Vérification de Fonctionnement**

### **1. 🔍 Test des Routes**
```bash
# Exécuter le script de test
python test-demo-routes.py

# Vérifier manuellement
curl http://localhost:8000/demo | jq
```

### **2. 🎨 Test de l'Interface**
```bash
# Ouvrir le navigateur
# Naviguer vers http://localhost:5173/mappings/demo
# Tester les deux modes (Studio et Workbench)
```

### **3. 🧪 Test des Fonctionnalités**
- ✅ **Création** de mapping
- ✅ **Validation** en temps réel
- ✅ **Tests** et compilation
- ✅ **Export** des résultats

---

**Version** : 2.2.0  
**Dernière mise à jour** : Août 2024  
**Statut** : ✅ **Guide Complet**  
**Workbench** : ✅ **Fonctionnel et Documenté**
