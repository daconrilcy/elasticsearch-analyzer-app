# 🚀 Plan de Déploiement V2.1

## 📋 **Vue d'ensemble**
Mapping DSL V2.1 avec métriques Prometheus avancées, endpoint apply automatique, et déploiement en production.

## 🔧 **1. Staging (Validation)**

### Tests de compilation
```bash
# Vérifier que les nouveaux champs sont présents
POST /api/v1/mappings/compile
{
  "dsl_version": "2.1",
  "index": "test_staging",
  "fields": [...]
}

# Vérifier dans la réponse :
# - ilm_policy.name
# - ingest_pipeline.name  
# - settings.index.lifecycle.name
# - settings.index.default_pipeline
```

### Tests de métriques
```bash
# Vérifier que les métriques sont exposées
GET /metrics

# Métriques attendues :
# - jsonpath_cache_hits_total
# - jsonpath_cache_misses_total
# - mapping_zip_pad_events_total
# - mapping_objectify_records_total
# - mapping_compile_total
# - mapping_apply_success_total
# - mapping_apply_fail_total
```

## 🚀 **2. Production (Déploiement)**

### Phase 1: Infrastructure
```bash
# 1. Appliquer les politiques ILM
PUT _ilm/policy/{name}
{
  "policy": {
    "phases": {
      "hot": {"min_age": "0ms", "actions": {"rollover": {"max_size": "30GB"}}},
      "warm": {"min_age": "1d", "actions": {"allocate": {"number_of_replicas": 0}}},
      "delete": {"min_age": "30d", "actions": {"delete": {}}}
    }
  }
}

# 2. Appliquer les pipelines d'ingestion
PUT _ingest/pipeline/{name}
{
  "description": "Pipeline V2.1 auto-généré",
  "processors": [
    {"set": {"field": "_meta.ingested_at", "value": "{{_ingest.timestamp}}"}},
    {"date": {"field": "created_at", "target_field": "created_at_parsed"}}
  ]
}
```

### Phase 2: Index + Alias
```bash
# 3. Créer l'index avec settings/mappings
PUT /{index}
{
  "settings": {
    "index.lifecycle.name": "{ilm_policy_name}",
    "index.default_pipeline": "{pipeline_name}",
    "index.number_of_shards": 3,
    "index.number_of_replicas": 1
  },
  "mappings": {...}
}

# 4. Créer l'alias d'écriture pour rollover
PUT /_aliases
{
  "actions": [
    {"add": {"index": "{index}", "alias": "{index}-write", "is_write_index": true}}
  ]
}
```

## 🔍 **3. Validation Post-Déploiement**

### Vérifications critiques
```bash
# 1. Politique ILM active
GET _ilm/policy/{name}

# 2. Pipeline d'ingestion fonctionnel
GET _ingest/pipeline/{name}

# 3. Settings corrects sur l'index
GET /{index}/_settings

# 4. Mappings corrects
GET /{index}/_mapping

# 5. Alias d'écriture configuré
GET /_alias/{index}-write
```

### Tests d'indexation
```bash
# Indexer 100 documents de test
POST /{index}/_doc/_bulk
{"index": {}}
{"name": "test1", "age": 25, "created_at": "2024-01-01"}
{"index": {}}
{"name": "test2", "age": 30, "created_at": "2024-01-02"}
...

# Vérifier la phase ILM
GET _ilm/explain/{index}
# Doit retourner "phase": "hot"
```

## 🔄 **4. Rollback (Si nécessaire)**

### Désactivation du pipeline
```bash
# Retirer le pipeline par défaut
PUT /{index}/_settings
{
  "index.default_pipeline": null
}
```

### Retour à l'index précédent
```bash
# Pointer l'alias vers l'ancien index
PUT /_aliases
{
  "actions": [
    {"remove": {"index": "{new_index}", "alias": "{index}-write"}},
    {"add": {"index": "{old_index}", "alias": "{index}-write", "is_write_index": true}}
  ]
}
```

### Nettoyage (optionnel)
```bash
# Supprimer les ressources V2.1 si non réutilisées
DELETE _ilm/policy/{name}
DELETE _ingest/pipeline/{name}
DELETE /{new_index}
```

## 📊 **5. Monitoring et Alertes**

### Métriques Prometheus critiques
```promql
# Cache JSONPath - ratio de hit > 80%
rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m])) > 0.8

# Latence des opérations - P95 < 100ms
histogram_quantile(0.95, sum(rate(mapping_op_ms_bucket[5m])) by (op,le)) < 100

# Budget d'opérations - aucune dépassement
increase(mapping_op_budget_exceeded_total[15m]) == 0

# Taux de succès des apply - > 95%
rate(mapping_apply_success_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m])) > 0.95
```

### Alertes Grafana
```yaml
# Cache JSONPath dégradé
- alert: JSONPathCacheDegraded
  expr: rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m])) < 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Cache JSONPath dégradé (< 80% hit rate)"

# Opérations lentes
- alert: MappingOpsSlow
  expr: histogram_quantile(0.95, sum(rate(mapping_op_ms_bucket[5m])) by (op,le)) > 100
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Opérations de mapping lentes (> 100ms P95)"

# Échecs d'application
- alert: MappingApplyFailing
  expr: rate(mapping_apply_fail_total[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Échecs d'application de mapping détectés"
```

## 🎯 **6. Checklist de Déploiement**

### Pré-déploiement
- [ ] Tests de staging validés
- [ ] Métriques Prometheus fonctionnelles
- [ ] Endpoint /apply testé
- [ ] Politiques ILM validées
- [ ] Pipelines d'ingestion testés

### Déploiement
- [ ] Backup des index existants
- [ ] Déploiement des politiques ILM
- [ ] Déploiement des pipelines d'ingestion
- [ ] Création des nouveaux index
- [ ] Configuration des alias d'écriture

### Post-déploiement
- [ ] Validation des settings/mappings
- [ ] Tests d'indexation réussis
- [ ] Monitoring des métriques
- [ ] Vérification des alertes
- [ ] Documentation mise à jour

## 📚 **7. Commandes Utiles**

### Vérification rapide
```bash
# Statut général du cluster
GET _cluster/health

# Politiques ILM actives
GET _ilm/policy

# Pipelines d'ingestion
GET _ingest/pipeline

# Indices avec lifecycle
GET _ilm/explain

# Métriques de l'application
GET /metrics
```

### Debug en cas de problème
```bash
# Logs détaillés d'ILM
GET _ilm/explain/{index}?verbose=true

# Test de pipeline
POST _ingest/pipeline/{name}/_simulate
{
  "docs": [{"_source": {"created_at": "2024-01-01"}}]
}

# Analyse des mappings
GET /{index}/_mapping?pretty
```

---

**🚀 V2.1 est prête pour la production !**

