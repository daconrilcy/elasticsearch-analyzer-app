# 📊 Configuration Grafana V2.1

## 🔧 Configuration

### **Docker Compose**
```yaml
grafana:
  image: grafana/grafana:10.2.0
  container_name: analyzer_grafana_dev
  restart: always
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
  volumes:
    - grafana_data:/var/lib/grafana
    - ./backend/grafana/provisioning:/etc/grafana/provisioning:ro
  networks:
    - analyzer_dev_network
```

### **Accès**
- **URL** : http://localhost:3000
- **Utilisateur** : `admin`
- **Mot de passe** : `admin`

## 📊 Dashboard V2.1

### **Import Automatique**
```bash
# Script d'import
python monitoring/import_dashboard_simple.py
```

### **Structure du Dashboard**
Le dashboard "Mapping DSL V2.1 - Production Monitoring" contient 9 panels :

#### **1. Performance de Compilation**
- **Panel** : Compilation Performance
- **Métrique** : `rate(mapping_compile_calls_total[5m])`
- **Type** : Stat
- **Description** : Taux de compilations par seconde

#### **2. Taux de Succès Apply**
- **Panel** : Apply Success Rate
- **Métrique** : `rate(mapping_apply_success_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m])) * 100`
- **Type** : Stat
- **Description** : Pourcentage de succès des opérations d'apply

#### **3. Performance Cache JSONPath**
- **Panel** : JSONPath Cache Performance
- **Métrique** : `rate(jsonpath_cache_hits_total[5m])`
- **Type** : Graph
- **Description** : Performance du cache JSONPath

#### **4. Ratio de Cache**
- **Panel** : Cache Hit Ratio
- **Métrique** : `rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m]))`
- **Type** : Gauge
- **Description** : Ratio de hits du cache (0-1)

#### **5. Opérations V2.1**
- **Panel** : Zip/Objectify Operations
- **Métriques** : 
  - `rate(mapping_zip_pad_events_total[5m])`
  - `rate(mapping_objectify_records_total[5m])`
- **Type** : Graph
- **Description** : Utilisation des nouvelles opérations V2.1

#### **6. Latence des Opérations**
- **Panel** : Operation Latency (P95)
- **Métrique** : `histogram_quantile(0.95, sum(rate(mapping_op_ms_bucket[5m])) by (op,le))`
- **Type** : Graph
- **Description** : Latence P95 des opérations par type

#### **7. Statut des Ressources**
- **Panel** : Resource Apply Status
- **Métrique** : `mapping_apply_success_total` vs `mapping_apply_fail_total`
- **Type** : Stat
- **Description** : Statut des applications par ressource (ILM, Pipeline, Index)

#### **8. Taille du Cache**
- **Panel** : Cache Size
- **Métrique** : `jsonpath_cache_size`
- **Type** : Gauge
- **Description** : Nombre d'expressions JSONPath en cache

#### **9. Alertes Budget**
- **Panel** : Budget Exceeded Alerts
- **Métrique** : `increase(mapping_op_budget_exceeded_total[15m])`
- **Type** : Alert
- **Description** : Alertes de dépassement de budget

## 🔌 Source de Données

### **Configuration Prometheus**
```json
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "http://prometheus:9090",
  "access": "proxy",
  "isDefault": true
}
```

### **Vérification**
```bash
# Vérifier l'accessibilité
curl http://localhost:3000/api/health

# Vérifier les sources de données
curl -u admin:admin http://localhost:3000/api/datasources
```

## 📈 Requêtes Prometheus Utiles

### **Performance Générale**
```promql
# Compilations par minute
rate(mapping_compile_calls_total[1m])

# Taux d'erreur global
rate(mapping_apply_fail_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m]))
```

### **Cache JSONPath**
```promql
# Ratio de hits du cache
rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m]))

# Taille du cache
jsonpath_cache_size
```

### **Opérations V2.1**
```promql
# Utilisation des opérations zip/objectify
rate(mapping_zip_pad_events_total[5m])
rate(mapping_objectify_records_total[5m])

# Latence des opérations
histogram_quantile(0.95, sum(rate(mapping_op_ms_bucket[5m])) by (op,le))
```

## 🚀 Démarrage

```bash
# Lancer Grafana
docker-compose up -d grafana

# Vérifier l'état
curl http://localhost:3000/api/health

# Importer le dashboard
python monitoring/import_dashboard_simple.py
```

## ⚠️ Dépannage

### **Dashboard non visible**
1. Vérifier que la source Prometheus est configurée
2. Vérifier que les métriques sont collectées
3. Vérifier les permissions utilisateur

### **Métriques manquantes**
1. Vérifier la connectivité Prometheus
2. Vérifier que le backend expose `/metrics`
3. Vérifier la configuration des targets

### **Import échoué**
1. Vérifier l'authentification (admin/admin)
2. Vérifier que le fichier JSON est valide
3. Vérifier les logs Grafana

## 🔄 Maintenance

### **Mise à jour du Dashboard**
```bash
# Recharger le dashboard
curl -X POST -u admin:admin http://localhost:3000/api/dashboards/db/refresh

# Vérifier la version
curl -u admin:admin http://localhost:3000/api/dashboards/uid/<uid>
```

### **Sauvegarde**
```bash
# Exporter le dashboard
curl -u admin:admin http://localhost:3000/api/dashboards/uid/<uid> > dashboard_backup.json

# Restaurer
curl -X POST -u admin:admin -H "Content-Type: application/json" \
  -d @dashboard_backup.json http://localhost:3000/api/dashboards/db
```

---

**Version** : 2.1.1  
**Dernière mise à jour** : Août 2025
