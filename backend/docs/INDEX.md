# 📚 Index de Documentation - Backend V2.2

## 🎯 Vue d'Ensemble

Cette documentation couvre l'implémentation complète du Mapping DSL V2.2 avec monitoring, tests organisés et déploiement production. La V2.2 étend V2.1 avec des opérations array avancées et des options de champ Elasticsearch.

## 📁 Structure de la Documentation

### 🚀 **V2.2 - Mapping DSL (Nouveau)**
| Fichier | Description | Contenu |
|---------|-------------|---------|
| [IMPLEMENTATION.md](v2.2/IMPLEMENTATION.md) | Guide d'implémentation V2.2 | Nouvelles opérations array, options de champ ES |
| [USAGE.md](v2.2/USAGE.md) | Guide d'utilisation V2.2 | Exemples pratiques, bonnes pratiques |
| [STATUS.md](v2.2/STATUS.md) | Statut final V2.2 | Implémentation, tests, validation |

### 🚀 **V2.1 - Mapping DSL (Base)**
| Fichier | Description | Contenu |
|---------|-------------|---------|
| [IMPLEMENTATION.md](v2.1/IMPLEMENTATION.md) | Résumé de l'implémentation | Fonctionnalités, fichiers modifiés, métriques |
| [STATUS.md](v2.1/STATUS.md) | Statut final et validation | Tests, validation, statut production |

### 🔌 **API**
| Fichier | Description | Contenu |
|---------|-------------|---------|
| [ENDPOINTS.md](api/ENDPOINTS.md) | Nouveaux endpoints V2.1 | /apply, métriques, authentification |

### 🛠️ **Développement**
| Fichier | Description | Contenu |
|---------|-------------|---------|
| [HARDENING.md](development/HARDENING.md) | Sécurisation et durcissement | Limites, validations, sécurité |
| [INCIDENTS.md](development/INCIDENTS.md) | Gestion des incidents | Procédures, playbook, résolution |
| [MAPPING_DSL.md](development/MAPPING_DSL.md) | Guide du DSL Mapping | Syntaxe, exemples, opérations |

### 📊 **Monitoring**
| Fichier | Description | Contenu |
|---------|-------------|---------|
| [PROMETHEUS.md](monitoring/PROMETHEUS.md) | Configuration Prometheus | Règles, métriques, alertes V2.1 |
| [GRAFANA.md](monitoring/GRAFANA.md) | Configuration Grafana | Dashboard, panels, métriques V2.1 |

## 🧪 Tests Organisés

### **Structure des Tests V2.2 + V2.1**
```
tests/
├── domain/mapping/
│   └── test_dsl_v21.py          # Tests DSL V2.1
├── api/v1/
│   ├── test_mappings_v22.py     # Tests API V2.2 (Nouveau)
│   └── test_mappings_v21.py     # Tests API V2.1
├── integration/
│   └── test_production_v21.py   # Tests production V2.1
└── utils/
    └── test_auth_helpers.py     # Helpers authentification
```

### **Couverture des Tests V2.2 + V2.1**
- ✅ **Validation DSL V2.2** : Nouvelles opérations array, options de champ ES
- ✅ **Validation DSL V2.1** : Containers, JSONPath, opérations
- ✅ **Compilation** : Génération ILM/Ingest automatique
- ✅ **API Endpoints** : validate, compile, dry-run, apply
- ✅ **Production** : Métriques, monitoring, performance
- ✅ **Authentification** : Session management, tokens

## 🚀 Déploiement

### **Environnement de Développement**
```bash
# Services Docker
docker-compose up -d

# Backend
cd backend && python main.py

# Tests
pytest tests/ -v
```

### **Monitoring**
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000 (admin/admin)
- **Backend** : http://localhost:8000

## 📊 Métriques V2.2 + V2.1

### **Performance**
- `mapping_compile_calls_total` - Compilations
- `mapping_apply_success_total` - Apply réussis
- `mapping_apply_fail_total` - Apply échoués

### **Cache JSONPath**
- `jsonpath_cache_hits_total` - Hits du cache
- `jsonpath_cache_misses_total` - Misses du cache
- `jsonpath_cache_size` - Taille du cache

### **Opérations V2.2 + V2.1**
- **V2.2** : Nouvelles opérations array (filter, slice, unique, sort)
- **V2.1** : `mapping_zip_pad_events_total` - Événements zip
- **V2.1** : `mapping_objectify_records_total` - Records objectify
- **V2.1** : `mapping_op_ms_count` - Latence des opérations

## 🚨 Alertes Prometheus

### **Critiques (Critical)**
- Taux d'échec d'apply > 5%
- Budget d'opérations dépassé
- Métriques indisponibles

### **Warnings**
- Latence de compilation P95 > 100ms
- Ratio cache JSONPath < 70%
- Taille cache > 500 expressions

## 🔧 Configuration

### **Fichiers de Configuration**
- `prometheus.yml` - Configuration Prometheus
- `prometheus_rules_v21.yml` - Règles d'alerte V2.1
- `alertmanager.yml` - Configuration Alertmanager
- `docker-compose.yml` - Services Docker

### **Variables d'Environnement**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyzer
ELASTICSEARCH_URL=http://localhost:9200
SECRET_KEY=your-secret-key
```

## 📝 Contribution

### **Standards**
- **Code** : PEP 8, type hints, docstrings
- **Tests** : pytest, couverture > 90%
- **Documentation** : Markdown, exemples, mise à jour

### **Workflow**
1. Développement sur feature branch
2. Tests complets (unit + integration)
3. Documentation mise à jour
4. Pull Request avec validation

## 🔗 Liens Utiles

### **Documentation Externe**
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web
- [Prometheus](https://prometheus.io/) - Monitoring
- [Grafana](https://grafana.com/) - Visualisation
- [Elasticsearch](https://www.elastic.co/) - Search engine

### **API Documentation**
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

---

**Version** : 2.1.1  
**Dernière mise à jour** : Août 2025  
**Statut** : ✅ Production Ready  
**Tests** : ✅ Organisés et Validés  
**Monitoring** : ✅ Configuré et Opérationnel
