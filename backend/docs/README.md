# 📚 Documentation Backend - Elasticsearch Analyzer

## 🏗️ Architecture

Ce backend implémente un système d'analyse et de transformation de données avec un DSL (Domain Specific Language) avancé pour Elasticsearch.

## 📁 Structure de la Documentation

### 🚀 **V2.2 - Mapping DSL (Nouveau)**
- **[IMPLEMENTATION.md](v2.2/IMPLEMENTATION.md)** - Guide d'implémentation V2.2
- **[USAGE.md](v2.2/USAGE.md)** - Guide d'utilisation V2.2
- **[STATUS.md](v2.2/STATUS.md)** - Statut final V2.2

### 🚀 **V2.1 - Mapping DSL (Base)**
- **[IMPLEMENTATION.md](v2.1/IMPLEMENTATION.md)** - Résumé de l'implémentation V2.1
- **[STATUS.md](v2.1/STATUS.md)** - Statut final et validation V2.1

### 🔌 **API**
- **[ENDPOINTS.md](api/ENDPOINTS.md)** - Nouveaux endpoints et fonctionnalités

### 🛠️ **Développement**
- **[HARDENING.md](development/HARDENING.md)** - Sécurisation et durcissement
- **[INCIDENTS.md](development/INCIDENTS.md)** - Gestion des incidents
- **[MAPPING_DSL.md](development/MAPPING_DSL.md)** - Guide du DSL Mapping

### 📊 **Monitoring**
- **[PROMETHEUS.md](monitoring/PROMETHEUS.md)** - Configuration Prometheus
- **[GRAFANA.md](monitoring/GRAFANA.md)** - Configuration Grafana

## 🎯 **Fonctionnalités Principales**

### **V2.2 - Mapping DSL Avancé (Nouveau)**
- **Opérations Array Avancées** : `filter`, `slice`, `unique`, `sort`
- **Options de Champ ES** : `copy_to`, `ignore_above`, `null_value`
- **Propriétés Root ES** : `dynamic_templates`, `runtime_fields`
- **Validation Renforcée** : Règles métier strictes V2.2

### **V2.1 - Mapping DSL Avancé (Base)**
- **Containers** : Support des types `nested` et `object`
- **JSONPath** : Inputs avancés avec expressions JSONPath
- **Opérations Array** : `zip`, `objectify`, `map`, `take`, `join`, `flatten`
- **Cache JSONPath** : Optimisation des performances
- **Génération Automatique** : ILM policies et Ingest pipelines

### **API REST**
- **Validation** : `/api/v1/mappings/validate`
- **Compilation** : `/api/v1/mappings/compile`
- **Dry-run** : `/api/v1/mappings/dry-run`
- **Apply** : `/api/v1/mappings/apply` (Production)

### **Monitoring & Observabilité**
- **Métriques Prometheus** : Métriques V2.1 complètes
- **Alertes** : Règles d'alerte intelligentes
- **Dashboard Grafana** : Visualisation des métriques V2.1

## 🚀 **Démarrage Rapide**

### **Prérequis**
- Python 3.8+
- PostgreSQL 16
- Elasticsearch 8.10+
- Docker & Docker Compose

### **Installation**
```bash
# Cloner le projet
git clone <repository>
cd elasticsearch-analyzer-app/backend

# Installer les dépendances
pip install -r requirements.txt

# Lancer les services
cd ..
docker-compose up -d

# Démarrer le backend
python main.py
```

### **Tests**
```bash
# Tests organisés V2.2 + V2.1
pytest tests/ -v

# Tests V2.2 (Nouveau)
pytest tests/api/v1/test_mappings_v22.py -v

# Tests V2.1 (Base)
pytest tests/domain/mapping/test_dsl_v21.py -v
pytest tests/api/v1/test_mappings_v21.py -v
pytest tests/integration/test_production_v21.py -v
```

## 🔧 **Configuration**

### **Environnement**
- **Port Backend** : 8000
- **Port PostgreSQL** : 5432
- **Port Elasticsearch** : 9200
- **Port Prometheus** : 9090
- **Port Grafana** : 3000

### **Variables d'Environnement**
```bash
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyzer

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Sécurité
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📊 **Métriques V2.1**

### **Performance**
- `mapping_compile_calls_total` - Compilations
- `mapping_apply_success_total` - Apply réussis
- `mapping_apply_fail_total` - Apply échoués

### **Cache JSONPath**
- `jsonpath_cache_hits_total` - Hits du cache
- `jsonpath_cache_misses_total` - Misses du cache
- `jsonpath_cache_size` - Taille du cache

### **Opérations V2.1**
- `mapping_zip_pad_events_total` - Événements zip
- `mapping_objectify_records_total` - Records objectify
- `mapping_op_ms_count` - Latence des opérations

## 🚨 **Alertes Prometheus**

### **Critiques**
- Taux d'échec d'apply > 5%
- Budget d'opérations dépassé
- Métriques indisponibles

### **Warnings**
- Latence de compilation P95 > 100ms
- Ratio cache JSONPath < 70%
- Taille cache > 500 expressions

## 📝 **Contribution**

### **Structure des Tests**
```
tests/
├── domain/          # Tests métier
├── api/             # Tests API
├── integration/     # Tests d'intégration
└── utils/           # Helpers de test
```

### **Standards de Code**
- **Python** : PEP 8, type hints
- **Tests** : pytest, couverture > 90%
- **Documentation** : Docstrings, README à jour

## 🔗 **Liens Utiles**

- **API Documentation** : http://localhost:8000/docs
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000 (admin/admin)
- **Elasticsearch** : http://localhost:9200

---

**Version** : 2.1.1  
**Dernière mise à jour** : Août 2025  
**Statut** : ✅ Production Ready
