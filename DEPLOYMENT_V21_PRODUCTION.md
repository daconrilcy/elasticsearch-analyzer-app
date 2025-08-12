# 🚀 Déploiement V2.1 en Production

## 📋 Vue d'ensemble

Ce document décrit la procédure complète de déploiement de la version 2.1 du Mapping DSL en production, incluant la validation, le monitoring et le rollback.

## 🎯 Objectifs du Déploiement V2.1

- **Nouvelles fonctionnalités** : Opérations `zip` et `objectify`, cache JSONPath ultra-rapide
- **Génération automatique** : Politiques ILM et pipelines d'ingestion Elasticsearch
- **Endpoint de production** : `/mappings/apply` pour déploiement automatisé
- **Monitoring avancé** : Métriques Prometheus et dashboard Grafana dédiés

## 🔧 Prérequis

### Infrastructure
- ✅ Elasticsearch 7.x+ opérationnel
- ✅ Prometheus + Alertmanager configurés
- ✅ Grafana accessible
- ✅ Base de données PostgreSQL opérationnelle

### Application
- ✅ Backend V2.1.1 déployé et testé
- ✅ Tests de validation V2.1 passés
- ✅ Métriques Prometheus exposées
- ✅ Endpoint `/apply` fonctionnel

## 📊 Phase 1 : Validation Pré-Production

### 1.1 Tests de Validation
```bash
# Test basique V2.1
cd backend
python test_simple_v21.py

# Test complet de production (avec authentification)
python test_production_v21.py
```

### 1.2 Vérification des Métriques
```bash
# Vérifier l'exposition des métriques V2.1
curl http://localhost:8000/metrics | grep -E "(mapping_compile_calls_total|jsonpath_cache_hits_total|mapping_zip_pad_events_total)"
```

### 1.3 Test Endpoint /apply
```bash
# Test avec mapping de production
curl -X POST http://localhost:8000/api/v1/mappings/apply \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d @mapping_production_v21.json
```

## 🚀 Phase 2 : Déploiement en Production

### 2.1 Déploiement de l'Application
```bash
# 1. Arrêt de l'application V2.0
sudo systemctl stop elasticsearch-analyzer-api

# 2. Sauvegarde de la version actuelle
cp -r /opt/elasticsearch-analyzer /opt/elasticsearch-analyzer-v2.0-backup

# 3. Déploiement de V2.1
cp -r backend/ /opt/elasticsearch-analyzer/
chown -R elasticsearch:elasticsearch /opt/elasticsearch-analyzer/

# 4. Redémarrage
sudo systemctl start elasticsearch-analyzer-api
sudo systemctl status elasticsearch-analyzer-api
```

### 2.2 Configuration du Monitoring
```bash
# 1. Import du dashboard Grafana
cd monitoring
python import_dashboard.py

# 2. Configuration des règles d'alerte Prometheus
cp prometheus_rules_v21.yml /etc/prometheus/rules/
# Redémarrer Prometheus pour charger les nouvelles règles
sudo systemctl restart prometheus
```

### 2.3 Validation Post-Déploiement
```bash
# 1. Vérification de la santé de l'application
curl http://localhost:8000/health

# 2. Vérification des métriques V2.1
curl http://localhost:8000/metrics | grep -E "(mapping_compile_calls_total|jsonpath_cache_hits_total)"

# 3. Test de compilation V2.1
curl -X POST http://localhost:8000/api/v1/mappings/compile \
  -H "Content-Type: application/json" \
  -d '{"dsl_version": "2.1", "index": "test", ...}'
```

## 📈 Phase 3 : Monitoring et Surveillance

### 3.1 Dashboard Grafana V2.1
- **URL** : `http://grafana:3000/dashboards`
- **Métriques clés** :
  - Compilation performance
  - Cache JSONPath hit ratio
  - Opérations zip/objectify
  - Latence des opérations

### 3.2 Alertes Prometheus
- **Critiques** : Échecs d'apply, budget dépassé
- **Warnings** : Latence élevée, cache faible
- **Info** : Pipelines trop longs

### 3.3 Métriques de Production
```promql
# Performance de compilation
rate(mapping_compile_calls_total[5m])

# Cache JSONPath
rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m]))

# Opérations V2.1
rate(mapping_zip_pad_events_total[5m])
rate(mapping_objectify_records_total[5m])
```

## 🔄 Phase 4 : Procédures de Rollback

### 4.1 Rollback Automatique (Critique)
```bash
# Si les métriques critiques dépassent les seuils
if [ $(curl -s http://localhost:8000/metrics | grep "mapping_apply_fail_total" | cut -d' ' -f2) -gt 10 ]; then
    echo "ALERTE CRITIQUE - Rollback automatique"
    sudo systemctl stop elasticsearch-analyzer-api
    cp -r /opt/elasticsearch-analyzer-v2.0-backup /opt/elasticsearch-analyzer
    sudo systemctl start elasticsearch-analyzer-api
fi
```

### 4.2 Rollback Manuel
```bash
# 1. Arrêt de l'application
sudo systemctl stop elasticsearch-analyzer-api

# 2. Restauration de la version précédente
rm -rf /opt/elasticsearch-analyzer
cp -r /opt/elasticsearch-analyzer-v2.0-backup /opt/elasticsearch-analyzer

# 3. Redémarrage
sudo systemctl start elasticsearch-analyzer-api

# 4. Vérification
curl http://localhost:8000/health
```

## 🧪 Phase 5 : Tests de Production

### 5.1 Test de Charge
```bash
# Script de test de charge V2.1
cd backend
python test_load_v21.py --users 100 --duration 300
```

### 5.2 Test de Résilience
```bash
# Test de récupération après panne
sudo systemctl stop elasticsearch-analyzer-api
sleep 30
sudo systemctl start elasticsearch-analyzer-api
# Vérifier la récupération automatique
```

### 5.3 Test de Performance
```bash
# Benchmark des nouvelles fonctionnalités
cd backend
python test_performance_v21.py --iterations 1000
```

## 📊 Phase 6 : Validation et Clôture

### 6.1 Critères de Succès
- ✅ Métriques V2.1 exposées et collectées
- ✅ Dashboard Grafana fonctionnel
- ✅ Alertes Prometheus configurées
- ✅ Endpoint `/apply` opérationnel
- ✅ Performance comparable ou supérieure à V2.0
- ✅ Aucune régression fonctionnelle

### 6.2 Documentation de Clôture
- 📝 Rapport de déploiement
- 📊 Métriques de référence
- 🔧 Procédures de maintenance
- 📚 Guide utilisateur V2.1

## 🚨 Gestion des Incidents

### Incident Critique
1. **Détection** : Alertes Prometheus, métriques critiques
2. **Évaluation** : Impact sur la production
3. **Action** : Rollback automatique ou manuel
4. **Communication** : Équipe technique + stakeholders
5. **Résolution** : Analyse root cause, correction
6. **Redéploiement** : Après validation complète

### Incident Mineur
1. **Détection** : Alertes warnings, dégradation performance
2. **Évaluation** : Impact limité
3. **Action** : Investigation, optimisation
4. **Suivi** : Monitoring renforcé

## 📞 Contacts et Escalade

### Équipe Technique
- **DevOps** : `devops@company.com`
- **Développement** : `dev@company.com`
- **Architecture** : `arch@company.com`

### Escalade
- **Niveau 1** : Équipe technique (30 min)
- **Niveau 2** : Lead technique (1h)
- **Niveau 3** : Architecte (2h)
- **Niveau 4** : CTO (4h)

## 📚 Ressources et Références

### Documentation
- [README V2.1](V21_IMPLEMENTATION_SUMMARY.md)
- [Guide Monitoring](README_MONITORING.md)
- [Schéma Mapping V2.1](backend/app/domain/mapping/validators/common/mapping.schema.json)

### Outils
- **Prometheus** : `http://prometheus:9090`
- **Grafana** : `http://grafana:3000`
- **Alertmanager** : `http://alertmanager:9093`
- **API Backend** : `http://localhost:8000`

### Métriques de Référence
- **Compilation** : < 100ms P95
- **Cache JSONPath** : > 80% hit ratio
- **Apply** : > 95% success rate
- **Opérations** : < 50ms P95

---

**Version** : 1.0  
**Date** : $(date +%Y-%m-%d)  
**Responsable** : Équipe Technique  
**Approuvé par** : CTO
