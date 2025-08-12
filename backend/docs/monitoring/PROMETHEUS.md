# 📊 Configuration Prometheus V2.1

## 🔧 Configuration

### **Fichier Principal**
```yaml
# backend/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "prometheus-rules.yml"           # Règles V1
  - "prometheus_rules_v21.yml"       # Règles V2.1

scrape_configs:
  - job_name: 'elasticsearch-analyzer-api'
    static_configs:
      - targets: ['192.168.1.26:8000']  # IP de votre machine hôte
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### **Docker Compose**
```yaml
prometheus:
  image: prom/prometheus:v2.45.0
  container_name: analyzer_prometheus_dev
  restart: always
  ports:
    - "9090:9090"
  volumes:
    - ./backend/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - ./backend/prometheus-rules.yml:/etc/prometheus/prometheus-rules.yml:ro
    - ./backend/prometheus_rules_v21.yml:/etc/prometheus/prometheus_rules_v21.yml:ro
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--web.console.libraries=/etc/prometheus/console_libraries'
    - '--web.console.templates=/etc/prometheus/consoles'
    - '--storage.tsdb.retention.time=200h'
```

## 🚨 Règles d'Alerte V2.1

### **Performance & Latence**
```yaml
- alert: MappingCompileHighLatency
  expr: histogram_quantile(0.95, sum(rate(mapping_compile_calls_total[5m])) by (le)) > 100
  for: 2m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1
  annotations:
    summary: "Latence de compilation élevée"
    description: "La latence P95 de compilation des mappings dépasse 100ms depuis {{ $labels.instance }}"

- alert: MappingOpHighLatency
  expr: histogram_quantile(0.95, sum(rate(mapping_op_ms_bucket[5m])) by (op,le)) > 100
  for: 2m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1
```

### **Fiabilité**
```yaml
- alert: MappingApplyFailureRate
  expr: rate(mapping_apply_fail_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m])) > 0.05
  for: 1m
  labels:
    severity: critical
    component: mapping_dsl
    version: v2.1

- alert: MappingOpBudgetExceeded
  expr: increase(mapping_op_budget_exceeded_total[15m]) > 0
  for: 1m
  labels:
    severity: critical
    component: mapping_dsl
    version: v2.1
```

### **Cache JSONPath**
```yaml
- alert: JSONPathCacheHitRatioLow
  expr: rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m])) < 0.7
  for: 3m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1

- alert: JSONPathCacheSizeHigh
  expr: jsonpath_cache_size > 500
  for: 2m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1
```

### **Opérations V2.1**
```yaml
- alert: MappingZipPaddingHigh
  expr: rate(mapping_zip_pad_events_total[5m]) > 10
  for: 2m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1

- alert: MappingObjectifyMissingFields
  expr: rate(mapping_objectify_missing_fields_total[5m]) > 5
  for: 2m
  labels:
    severity: warning
    component: mapping_dsl
    version: v2.1
```

## 📊 Métriques Collectées

### **Compilation**
- `mapping_compile_calls_total` - Nombre total de compilations
- `mapping_compile_duration_seconds` - Durée des compilations

### **Apply**
- `mapping_apply_success_total` - Nombre d'applications réussies
- `mapping_apply_fail_total` - Nombre d'applications échouées

### **Cache JSONPath**
- `jsonpath_cache_hits_total` - Hits du cache
- `jsonpath_cache_misses_total` - Misses du cache
- `jsonpath_cache_size` - Taille du cache

### **Opérations V2.1**
- `mapping_zip_pad_events_total` - Événements de padding zip
- `mapping_objectify_records_total` - Records objectify créés
- `mapping_op_ms_count` - Latence des opérations

## 🔍 Vérification

### **État des Règles**
```bash
curl http://localhost:9090/api/v1/rules
```

### **Targets**
```bash
curl http://localhost:9090/api/v1/targets
```

### **Métriques**
```bash
curl http://localhost:9090/api/v1/query?query=mapping_compile_calls_total
```

## 🚀 Démarrage

```bash
# Redémarrer Prometheus
docker-compose restart prometheus

# Vérifier les logs
docker-compose logs prometheus --tail=50

# Vérifier l'état
curl http://localhost:9090/api/v1/rules
```

## ⚠️ Dépannage

### **Règles non chargées**
1. Vérifier que les fichiers sont montés dans le conteneur
2. Vérifier la syntaxe YAML
3. Redémarrer Prometheus

### **Métriques non collectées**
1. Vérifier que le backend expose `/metrics`
2. Vérifier la connectivité réseau
3. Vérifier les logs Prometheus

---

**Version** : 2.1.1  
**Dernière mise à jour** : Août 2025
