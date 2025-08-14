# 📊 **MONITORING V2 - Mapping DSL V2.0.1**

## 🎯 **Métriques Prometheus V2**

### **Métriques de performance :**
```yaml
# Dry-run V2 performance
mapping_v2_dry_run_duration_seconds:
  description: "Durée des dry-runs V2 (p95, p99)"
  buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
  
mapping_v2_compile_duration_seconds:
  description: "Durée de compilation V2 (p95, p99)"
  buckets: [0.01, 0.05, 0.1, 0.5, 1.0]

mapping_v2_validation_duration_seconds:
  description: "Durée de validation V2 (p95, p99)"
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5]
```

### **Métriques de qualité :**
```yaml
# Validation V2 success rate
mapping_v2_validation_success_total:
  description: "Total des validations V2 réussies"
  
mapping_v2_validation_errors_total:
  description: "Total des erreurs de validation V2 par code"
  labels: ["code", "dsl_version"]

# Compilation V2 success rate
mapping_v2_compile_success_total:
  description: "Total des compilations V2 réussies"
  
mapping_v2_compile_errors_total:
  description: "Total des erreurs de compilation V2 par code"
  labels: ["code", "dsl_version"]

# Dry-run V2 success rate
mapping_v2_dry_run_success_total:
  description: "Total des dry-runs V2 réussis"
  
mapping_v2_dry_run_errors_total:
  description: "Total des erreurs de dry-run V2 par code"
  labels: ["code", "dsl_version"]
```

### **Métriques de fonctionnalités V2 :**
```yaml
# Usage des fonctionnalités V2
mapping_v2_containers_usage_total:
  description: "Usage des containers V2 par type"
  labels: ["container_type"] # object, nested
  
mapping_v2_jsonpath_usage_total:
  description: "Usage de JSONPath V2"
  
mapping_v2_array_ops_usage_total:
  description: "Usage des opérations array-aware V2"
  labels: ["operation"] # map, take, join, flatten
  
mapping_v2_new_ops_usage_total:
  description: "Usage des nouvelles opérations V2"
  labels: ["operation"] # length, literal, regex_extract
```

## 🚨 **Alertes Prometheus V2**

### **Alertes de performance :**
```yaml
# Dry-run V2 trop lent
- alert: MappingV2DryRunSlow
  expr: histogram_quantile(0.95, mapping_v2_dry_run_duration_seconds) > 5.0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Dry-run V2 lent (p95 > 5s)"
    description: "Le dry-run V2 est lent sur {{ $labels.instance }}"

# Compilation V2 trop lente
- alert: MappingV2CompileSlow
  expr: histogram_quantile(0.95, mapping_v2_compile_duration_seconds) > 1.0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Compilation V2 lente (p95 > 1s)"
    description: "La compilation V2 est lente sur {{ $labels.instance }}"
```

### **Alertes de qualité :**
```yaml
# Taux d'erreur de validation V2 élevé
- alert: MappingV2ValidationErrorRate
  expr: rate(mapping_v2_validation_errors_total[5m]) / rate(mapping_v2_validation_success_total[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Taux d'erreur de validation V2 élevé (>10%)"
    description: "Trop d'erreurs de validation V2 sur {{ $labels.instance }}"

# Taux d'erreur de compilation V2 élevé
- alert: MappingV2CompileErrorRate
  expr: rate(mapping_v2_compile_errors_total[5m]) / rate(mapping_v2_compile_success_total[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Taux d'erreur de compilation V2 élevé (>10%)"
    description: "Trop d'erreurs de compilation V2 sur {{ $labels.instance }}"
```

## 📈 **Dashboard Grafana V2**

### **Overview V2 :**
- **Validation V2** : Taux de succès, erreurs par code, durée p95/p99
- **Compilation V2** : Taux de succès, erreurs par code, durée p95/p99
- **Dry-run V2** : Taux de succès, erreurs par code, durée p95/p99

### **Fonctionnalités V2 :**
- **Containers** : Usage par type (object/nested), erreurs
- **JSONPath** : Usage, erreurs, longueur moyenne des expressions
- **Opérations array-aware** : Usage par opération, erreurs
- **Nouvelles opérations** : Usage par opération, erreurs

### **Performance V2 :**
- **Latence** : Validation, compilation, dry-run (p50, p95, p99)
- **Throughput** : Requêtes par seconde par endpoint
- **Erreurs** : Taux d'erreur par endpoint et par code

## 🔍 **Métriques clés à surveiller**

### **SLA V2 :**
- ✅ **Validation V2** : < 100ms (p95)
- ✅ **Compilation V2** : < 500ms (p95)
- ✅ **Dry-run V2** : < 5s (p95)
- ✅ **Taux d'erreur** : < 1% (tous endpoints)

### **KPI V2 :**
- 📊 **Adoption V2** : % de mappings utilisant V2
- 📊 **Fonctionnalités V2** : Usage des containers, JSONPath, opérations array-aware
- 📊 **Performance V2** : Amélioration vs V1
- 📊 **Qualité V2** : Réduction des erreurs vs V1

---

**📊 MONITORING V2 CONFIGURÉ - PRODUCTION READY 📊**
