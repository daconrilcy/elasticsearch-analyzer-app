# 📊 Monitoring et Observabilité - Elasticsearch Analyzer

Ce document décrit l'infrastructure de monitoring complète de l'application Elasticsearch Analyzer, incluant Prometheus, Alertmanager et Grafana.

## 🏗️ Architecture de Monitoring

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend       │    │   Prometheus    │    │   Alertmanager  │
│   FastAPI       │───▶│   (Collecte)    │───▶│   (Alertes)     │
│   /metrics      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Grafana     │
                       │  (Visualisation)│
                       └─────────────────┘
```

## 🚀 Services de Monitoring

### 1. **Prometheus** - Collecte de Métriques
- **Port** : 9090
- **URL** : http://localhost:9090
- **Rôle** : Collecte, stockage et interrogation des métriques
- **Configuration** : `backend/prometheus.yml`

**Fonctionnalités :**
- Scraping automatique des métriques du backend
- Stockage des données historiques (rétention : 200h)
- Règles d'alerte configurées
- Intégration avec Alertmanager

### 2. **Alertmanager** - Gestion des Alertes
- **Port** : 9093
- **URL** : http://localhost:9093
- **Rôle** : Gestion des notifications et alertes
- **Configuration** : `backend/alertmanager.yml`

**Fonctionnalités :**
- Groupement des alertes par nom
- Configuration des récepteurs (webhook, email)
- Règles d'inhibition
- Interface de gestion des alertes

### 3. **Grafana** - Visualisation
- **Port** : 3000
- **URL** : http://localhost:3000
- **Identifiants** : `admin` / `admin`
- **Rôle** : Dashboards et visualisation des métriques

**Fonctionnalités :**
- Dashboard automatiquement provisionné
- Source de données Prometheus configurée
- Panneaux de métriques personnalisés
- Interface intuitive et responsive

## 📊 Métriques Disponibles

### Métriques Métier
- `mapping_check_ids_total` : Total des vérifications d'ID
- `mapping_check_ids_duplicates_total` : Total des doublons détectés
- `mapping_check_ids_created` : Timestamp de création
- `mapping_check_ids_duplicates_created` : Timestamp de détection des doublons

### Métriques Système
- Métriques Prometheus standard
- Métriques de santé des services
- Métriques de performance

## 🎯 Dashboard Grafana

### **Elasticsearch Analyzer Dashboard**

**Panneaux disponibles :**

1. **Vérifications d'ID - Total**
   - Type : Stat
   - Métrique : `mapping_check_ids_total`
   - Affichage : Nombre total de vérifications

2. **Doublons d'ID détectés**
   - Type : Stat
   - Métrique : `mapping_check_ids_duplicates_total`
   - Affichage : Nombre total de doublons

3. **Taux de doublons (%)**
   - Type : Jauge
   - Calcul : `(doublons / total) * 100`
   - Affichage : Pourcentage de doublons

4. **Métriques de vérification d'ID**
   - Type : Graphique temporel
   - Métriques : Total et doublons
   - Affichage : Évolution dans le temps

## ⚙️ Configuration

### Fichiers de Configuration

#### `backend/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "prometheus-rules.yml"

scrape_configs:
  - job_name: 'elasticsearch-analyzer-api'
    static_configs:
      - targets: ['192.168.1.26:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

#### `backend/alertmanager.yml`
```yaml
route:
  receiver: 'default'

receivers:
  - name: 'default'
    # Configuration des notifications
```

#### `backend/grafana/provisioning/datasources/prometheus.yml`
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

## 🚀 Démarrage Rapide

### 1. **Lancer tous les services**
```bash
docker-compose up -d
```

### 2. **Vérifier le statut**
```bash
docker-compose ps
```

### 3. **Accéder aux interfaces**
- Grafana : http://localhost:3000 (admin/admin)
- Prometheus : http://localhost:9090
- Alertmanager : http://localhost:9093

### 4. **Générer des métriques de test**
```bash
# Depuis le dossier backend
curl -X POST "http://localhost:8000/api/v1/mappings/check-ids/test" \
  -H "Content-Type: application/json" \
  -d @test_check_ids.json
```

## 🔧 Maintenance et Dépannage

### Logs des Services
```bash
# Prometheus
docker-compose logs prometheus

# Alertmanager
docker-compose logs alertmanager

# Grafana
docker-compose logs grafana
```

### Redémarrage des Services
```bash
# Redémarrer un service spécifique
docker-compose restart prometheus

# Redémarrer tous les services
docker-compose restart
```

### Vérification de la Santé
```bash
# Prometheus
curl http://localhost:9090/-/healthy

# Alertmanager
curl http://localhost:9093/-/ready

# Grafana
curl http://localhost:3000/api/health
```

## 📈 Personnalisation

### Ajouter de Nouvelles Métriques
1. Exposer la métrique dans le backend FastAPI
2. Ajouter un panneau dans le dashboard Grafana
3. Configurer des alertes si nécessaire

### Modifier le Dashboard
1. Éditer `backend/grafana/provisioning/dashboards/elasticsearch-analyzer-dashboard.json`
2. Redémarrer Grafana : `docker-compose restart grafana`

### Configurer des Alertes
1. Modifier `backend/prometheus-rules.yml`
2. Redémarrer Prometheus : `docker-compose restart prometheus`

## 🔒 Sécurité

### Accès aux Interfaces
- **Grafana** : Authentification admin/admin (à changer en production)
- **Prometheus** : Accès public (à sécuriser en production)
- **Alertmanager** : Accès public (à sécuriser en production)

### Recommandations Production
- Changer les mots de passe par défaut
- Configurer l'authentification pour Prometheus et Alertmanager
- Utiliser HTTPS pour toutes les interfaces
- Restreindre l'accès aux ports de monitoring

## 📚 Ressources Utiles

- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Documentation Grafana](https://grafana.com/docs/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 🆘 Support

En cas de problème :
1. Vérifier les logs des services
2. Contrôler la connectivité entre les services
3. Vérifier la configuration des fichiers YAML
4. S'assurer que tous les ports sont accessibles

---

*Dernière mise à jour : Août 2025*
