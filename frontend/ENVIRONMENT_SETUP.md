# 🚀 **Configuration de l'Environnement - Mapping Studio V2.2**

## 📋 **Vue d'ensemble**

Ce guide explique comment configurer les variables d'environnement pour le développement et la production du Mapping Studio.

## 🔧 **Configuration de Développement**

### **1. Variables Requises**

Créez un fichier `.env` dans le dossier `frontend/` avec les variables suivantes :

```bash
# API Configuration (REQUIRED)
VITE_API_BASE=http://localhost:8000

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
VITE_ENABLE_ANALYTICS=false

# Performance Settings
VITE_DEBOUNCE_DELAY=500
VITE_RATE_LIMIT_REQUESTS=5
VITE_RATE_LIMIT_WINDOW=1000
```

### **2. Configuration Automatique**

Si `VITE_API_BASE` n'est pas défini en développement, l'application utilisera automatiquement `http://localhost:8000` comme fallback.

## 🌍 **Configuration de Production**

### **1. Variables Requises**

```bash
# API Configuration (REQUIRED)
VITE_API_BASE=https://your-api-domain.com/api/v1

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
VITE_ENABLE_ANALYTICS=false
```

### **2. Validation Stricte**

En production, `VITE_API_BASE` est **obligatoire** et l'application s'arrêtera si elle n'est pas définie.

## 🐳 **Configuration Docker**

### **1. Variables d'Environnement**

```yaml
# docker-compose.yml
environment:
  - VITE_API_BASE=http://backend:8000
  - VITE_ENABLE_METRICS=true
```

### **2. Fichier .env**

```bash
# .env
VITE_API_BASE=http://localhost:8000
VITE_ENABLE_METRICS=true
```

## 🔍 **Dépannage**

### **Erreur : "VITE_API_BASE est requis"**

**Cause** : Variable d'environnement manquante
**Solution** : Créer un fichier `.env` avec `VITE_API_BASE=http://localhost:8000`

### **Erreur : "Cannot connect to API"**

**Cause** : Backend non démarré ou port incorrect
**Solution** : 
1. Démarrer le backend : `cd backend && python main.py`
2. Vérifier le port : `http://localhost:8000`
3. Vérifier la configuration proxy dans `vite.config.ts`

### **Erreur : "CORS Error"**

**Cause** : Configuration CORS incorrecte
**Solution** : Vérifier la configuration CORS dans le backend

## 📚 **Fichiers de Configuration**

| Fichier | Usage | Statut |
|---------|-------|---------|
| **`.env`** | Variables locales (non commitées) | 🔒 Créer manuellement |
| **`.env.example`** | Modèle de configuration | 📋 Template |
| **`env.production`** | Configuration production | 🚀 Production |
| **`vite.config.ts`** | Configuration Vite + proxy | ⚙️ Développement |

## 🚀 **Démarrage Rapide**

### **1. Développement**
```bash
cd frontend
# Créer .env si nécessaire
npm run dev
```

### **2. Production**
```bash
cd frontend
# Copier env.production vers .env
cp env.production .env
# Éditer .env avec vos valeurs
npm run build
```

## ✅ **Vérification**

### **1. Test de Connexion**
```bash
# Vérifier que l'API est accessible
curl http://localhost:8000/health
```

### **2. Test Frontend**
```bash
# Démarrer le frontend
npm run dev
# Vérifier dans la console qu'il n'y a pas d'erreur VITE_API_BASE
```

---

**Version** : 2.2.0  
**Dernière mise à jour** : Août 2024  
**Statut** : ✅ **Configuration Documentée**
