# 📊 **Guide de Monitoring - Elasticsearch Analyzer App**

## 📖 **Vue d'ensemble**

Ce guide couvre la configuration et l'utilisation du monitoring complet de l'application avec Prometheus, Grafana et les métriques personnalisées.

## 🎯 **Architecture de Monitoring**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Backend   │───▶│ Prometheus │───▶│   Grafana   │
│  FastAPI   │    │  (Collecte) │    │(Visualisation)│
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Métriques  │    │   Alertes   │    │  Dashboards │
│  Custom     │    │  Prometheus │    │   Temps     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔧 **Configuration Prometheus**

### **Fichier de Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'elasticsearch-analyzer'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### **Métriques Collectées**
- **Performance** : Latence des opérations, taux de succès
- **Business** : Utilisation des fonctionnalités, erreurs
- **Système** : Ressources, base de données, Elasticsearch

## 📈 **Métriques Principales**

### **Mapping DSL V2.2**
```prometheus
# Compilation des mappings
mapping_compile_calls_total{version="v2.2"}
mapping_compile_duration_seconds{version="v2.2"}

# Application des mappings
mapping_apply_success_total{version="v2.2"}
mapping_apply_fail_total{version="v2.2"}

# Opérations array
mapping_array_operations_total{operation="filter"}
mapping_array_operations_total{operation="slice"}
mapping_array_operations_total{operation="unique"}
mapping_array_operations_total{operation="sort"}
```

### **Mapping DSL V2.1**
```prometheus
# Opérations de base
mapping_zip_pad_events_total
mapping_objectify_records_total
mapping_op_ms_count{operation="zip"}

# Cache JSONPath
jsonpath_cache_hits_total
jsonpath_cache_misses_total
jsonpath_cache_size
```

### **Performance et Erreurs**
```prometheus
# Latence
http_request_duration_seconds{endpoint="/mappings/validate"}
http_request_duration_seconds{endpoint="/mappings/compile"}

# Erreurs
http_requests_total{status="500"}
http_requests_total{status="400"}

# Disponibilité
up{job="elasticsearch-analyzer"}
```

## 🚨 **Règles d'Alerte**

### **Alertes Critiques**
```yaml
# prometheus_rules.yml
groups:
  - name: elasticsearch-analyzer-critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Taux d'erreur élevé"
          description: "Plus de 5% d'erreurs sur 5 minutes"

      - alert: MappingApplyFailure
        expr: rate(mapping_apply_fail_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Échecs d'application des mappings"
          description: "Plus de 10% d'échecs sur 5 minutes"
```

### **Alertes Warning**
```yaml
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latence élevée P95"
          description: "Latence P95 > 100ms"

      - alert: LowCacheHitRate
        expr: rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m])) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Taux de cache JSONPath faible"
          description: "Taux de cache < 70%"
```

## 📊 **Configuration Grafana**

### **Dashboard Principal**
- **Mapping Studio Overview** : Vue d'ensemble des performances
- **Opérations V2.2** : Métriques des nouvelles fonctionnalités
- **Opérations V2.1** : Métriques des fonctionnalités de base
- **Système** : Ressources et santé des services

### **Panels Recommandés**
```json
{
  "panels": [
    {
      "title": "Taux de Succès des Mappings",
      "type": "stat",
      "targets": [
        {
          "expr": "rate(mapping_apply_success_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m])) * 100"
        }
      ]
    },
    {
      "title": "Latence P95 des Opérations",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, mapping_op_ms_count)"
        }
      ]
    }
  ]
}
```

## 🔍 **Requêtes PromQL Utiles**

### **Performance des Opérations**
```promql
# Latence moyenne des opérations V2.2
rate(mapping_compile_duration_seconds_sum[5m]) / rate(mapping_compile_duration_seconds_count[5m])

# Taux de succès global
rate(mapping_apply_success_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m]))

# Utilisation du cache JSONPath
rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m]))
```

### **Tendances et Patterns**
```promql
# Évolution des erreurs sur 24h
increase(http_requests_total{status=~"5.."}[24h])

# Performance par version
rate(mapping_compile_duration_seconds_sum[5m]) by (version)

# Top des opérations les plus utilisées
topk(5, rate(mapping_array_operations_total[5m]))
```

## 🚨 **Gestion des Incidents**

### **Procédure de Diagnostic**
1. **Vérifier les métriques** : Prometheus + Grafana
2. **Analyser les logs** : Backend + Frontend
3. **Contrôler la santé** : Health checks des services
4. **Identifier le goulot d'étranglement** : Métriques de performance

### **Métriques d'Urgence**
```promql
# Disponibilité du service
up{job="elasticsearch-analyzer"}

# Erreurs en temps réel
rate(http_requests_total{status=~"5.."}[1m])

# Latence critique
histogram_quantile(0.99, http_request_duration_seconds)
```

## 📋 **Checklist de Monitoring**

### **Configuration**
- [ ] Prometheus configuré et collectant
- [ ] Règles d'alerte définies
- [ ] Grafana connecté à Prometheus
- [ ] Dashboards créés et configurés

### **Surveillance**
- [ ] Alertes testées et fonctionnelles
- [ ] Métriques collectées en continu
- [ ] Logs centralisés et analysables
- [ ] Performance surveillée

### **Maintenance**
- [ ] Règles d'alerte mises à jour
- [ ] Dashboards optimisés
- [ ] Métriques archivées
- [ ] Documentation maintenue

## 🔗 **Liens Utiles**

- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000 (admin/admin)
- **Documentation Prometheus** : https://prometheus.io/docs/
- **Documentation Grafana** : https://grafana.com/docs/

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready
