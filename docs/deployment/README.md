# 🚀 **Guide de Déploiement - Elasticsearch Analyzer App**

## 📋 **Table des Matières**
- [📖 Vue d'ensemble](#-vue-densemble)
- [🎯 Environnements Supportés](#-environnements-supportés)
- [🐳 Déploiement avec Docker](#-déploiement-avec-docker)
- [🔧 Déploiement Manuel](#-déploiement-manuel)
- [🌍 Configuration d'Environnement](#-configuration-denvironnement)
- [🔒 Sécurité en Production](#-sécurité-en-production)
- [🚨 Gestion des Incidents](#-gestion-des-incidents)
- [📈 Scaling et Performance](#-scaling-et-performance)
- [🔄 Mise à Jour et Maintenance](#-mise-à-jour-et-maintenance)
- [📋 Checklist de Déploiement](#-checklist-de-déploiement)
- [📚 Ressources](#-ressources)

---

## 📖 **Vue d'ensemble**

Ce guide couvre tous les aspects du déploiement de l'application Elasticsearch Analyzer App, du développement à la production.

### **🎯 Objectifs du Guide**
- **Déploiement automatisé** avec Docker Compose
- **Configuration sécurisée** pour la production
- **Monitoring et observabilité** intégrés
- **Procédures de maintenance** documentées

---

## 🎯 **Environnements Supportés**

| Environnement | Description | Outils | Statut |
|---------------|-------------|--------|---------|
| **Développement** | Docker Compose local | Docker, Python, Node.js | ✅ Prêt |
| **Staging** | Déploiement intermédiaire | Docker Swarm, Kubernetes | 🔶 En cours |
| **Production** | Déploiement en production avec monitoring | Kubernetes, Helm | 🚀 Prêt |

---

## 🐳 **Déploiement avec Docker (Recommandé)**

### **📋 Services Requis**
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Services inclus :
# - PostgreSQL (base de données)
# - Elasticsearch (moteur de recherche)
# - Prometheus (monitoring)
# - Grafana (visualisation)
# - Backend FastAPI
# - Frontend React
```

### **⚙️ Configuration Docker**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: analyzer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
  
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  es_data:
  prometheus_data:
  grafana_data:
```

### **🔍 Vérification des Services**
```bash
# Vérifier la santé des services
curl http://localhost:8000/health
curl http://localhost:9200/_cluster/health
curl http://localhost:9090/-/healthy
curl http://localhost:3000/api/health

# Vérifier les logs
docker-compose logs -f [service_name]
```

---

## 🔧 **Déploiement Manuel**

### **⚙️ Backend (FastAPI)**
```bash
# 1. Activer l'environnement virtuel
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate     # Windows

# 2. Installer les dépendances
cd backend
pip install -r requirements.txt

# 3. Configurer la base de données
alembic upgrade head

# 4. Lancer l'application
python main.py

# 5. Vérifier le statut
curl http://localhost:8000/health
```

### **🎨 Frontend (React)**
```bash
# 1. Installer les dépendances
cd frontend
npm install

# 2. Configuration d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Build de production
npm run build

# 4. Déployer le dossier 'dist'
# Option 1: Serveur web statique
npm install -g serve
serve -s dist -l 3000

# Option 2: Nginx
sudo cp -r dist/* /var/www/html/
```

### **🔧 Base de Données**
```bash
# 1. Créer la base de données
createdb analyzer

# 2. Appliquer les migrations
cd backend
alembic upgrade head

# 3. Vérifier le statut
alembic current
alembic history
```

---

## 🌍 **Configuration d'Environnement**

### **📁 Variables d'Environnement Backend**
```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyzer
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
DEBUG=false
LOG_LEVEL=INFO
```

### **📁 Variables d'Environnement Frontend**
```bash
# .env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Elasticsearch Analyzer
VITE_APP_VERSION=2.2.1
VITE_ENABLE_ANALYTICS=false
```

### **🔧 Configuration Nginx**
```nginx
# /etc/nginx/sites-available/elasticsearch-analyzer
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Monitoring
    location /metrics {
        proxy_pass http://localhost:8000/metrics;
    }
}
```

---

## 🔒 **Sécurité en Production**

### **🔐 Authentification**
- **JWT Tokens** : Gestion des sessions sécurisées
- **Rate Limiting** : Protection contre la surcharge
- **CORS** : Configuration des origines autorisées
- **Validation des entrées** : Sanitisation des données

### **🔒 HTTPS et SSL**
```bash
# Configuration Nginx avec SSL
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### **🛡️ Sécurité Supplémentaire**
- **Firewall** : UFW ou iptables
- **Fail2ban** : Protection contre les attaques
- **Sécurité des conteneurs** : Images scannées, droits minimaux
- **Backup chiffré** : Sauvegarde sécurisée des données

---

## 🚨 **Gestion des Incidents**

### **🚨 Procédures d'Urgence**
1. **Vérifier les logs** : `docker-compose logs -f [service]`
2. **Contrôler les métriques** : Prometheus + Grafana
3. **Redémarrer les services** : `docker-compose restart [service]`
4. **Restauration** : Base de données + Elasticsearch
5. **Escalade** : Contacter l'équipe DevOps

### **📞 Contacts d'Urgence**
| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| **DevOps** | devops@company.com | 24/7 |
| **Développement** | dev@company.com | 9h-18h |
| **Support** | support@company.com | 24/7 |
| **Manager** | manager@company.com | 9h-18h |

### **🔍 Diagnostic Automatique**
```bash
# Script de diagnostic
#!/bin/bash
echo "=== Diagnostic Elasticsearch Analyzer ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""

echo "=== Services Status ==="
docker-compose ps
echo ""

echo "=== Health Checks ==="
curl -s http://localhost:8000/health || echo "Backend KO"
curl -s http://localhost:9200/_cluster/health || echo "Elasticsearch KO"
curl -s http://localhost:9090/-/healthy || echo "Prometheus KO"
curl -s http://localhost:3000/api/health || echo "Grafana KO"
echo ""

echo "=== Resource Usage ==="
docker stats --no-stream
echo ""

echo "=== Recent Logs ==="
docker-compose logs --tail=20
```

---

## 📈 **Scaling et Performance**

### **⚡ Backend**
- **Workers** : Uvicorn avec multiple workers
- **Cache** : Redis pour les métriques et sessions
- **Load Balancer** : Nginx ou HAProxy
- **Base de données** : Connection pooling, réplication

### **🎨 Frontend**
- **CDN** : Distribution statique (CloudFlare, AWS CloudFront)
- **Cache** : Headers HTTP appropriés
- **Compression** : Gzip/Brotli
- **Lazy Loading** : Chargement à la demande

### **📊 Monitoring de Performance**
```bash
# Métriques clés à surveiller
- Latence API (P50, P95, P99)
- Taux de requêtes par seconde
- Utilisation CPU/Mémoire
- Temps de réponse base de données
- Taux d'erreur
```

---

## 🔄 **Mise à Jour et Maintenance**

### **📋 Procédure de Mise à Jour**
```bash
# 1. Sauvegarde
docker-compose exec postgres pg_dump -U postgres analyzer > backup_$(date +%Y%m%d_%H%M%S).sql
docker-compose exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$(date +%Y%m%d_%H%M%S)"

# 2. Pull des nouvelles images
docker-compose pull

# 3. Mise à jour
docker-compose up -d

# 4. Vérification
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:8000/version
```

### **🔄 Rollback**
```bash
# Revenir à la version précédente
git checkout HEAD~1
docker-compose down
docker-compose up -d

# Restaurer la base de données si nécessaire
docker-compose exec postgres psql -U postgres analyzer < backup_previous.sql
```

### **🔧 Maintenance Préventive**
- **Mise à jour des dépendances** : Mensuelle
- **Rotation des logs** : Quotidienne
- **Sauvegarde des données** : Hebdomadaire
- **Tests de régression** : Avant chaque déploiement
- **Mise à jour des images** : Bimensuelle

---

## 📋 **Checklist de Déploiement**

### **✅ Pré-déploiement**
- [ ] **Tests unitaires** passent
- [ ] **Tests d'intégration** validés
- [ ] **Base de données** migrée
- [ ] **Variables d'environnement** configurées
- [ ] **Sauvegarde** effectuée
- [ ] **Équipe** notifiée

### **✅ Déploiement**
- [ ] **Services** démarrés
- [ ] **Health checks** OK
- [ ] **Métriques** collectées
- [ ] **Logs** surveillés
- [ ] **Performance** validée

### **✅ Post-déploiement**
- [ ] **Fonctionnalités** testées
- [ ] **Performance** validée
- [ ] **Alertes** configurées
- [ ] **Documentation** mise à jour
- [ ] **Équipe** notifiée du succès

---

## 📚 **Ressources**

### **🔗 Documentation Externe**
- [Docker Compose](https://docs.docker.com/compose/) - Orchestration des conteneurs
- [Nginx](https://nginx.org/en/docs/) - Serveur web et reverse proxy
- [PostgreSQL](https://www.postgresql.org/docs/) - Base de données
- [Elasticsearch](https://www.elastic.co/guide/) - Moteur de recherche

### **📋 Scripts Utiles**
- **Diagnostic** : `scripts/diagnostic.sh`
- **Backup** : `scripts/backup.sh`
- **Deploy** : `scripts/deploy.sh`
- **Rollback** : `scripts/rollback.sh`

### **🧪 Tests de Validation**
```bash
# Tests de déploiement
npm run test:deployment
pytest tests/deployment/ -v

# Tests de performance
npm run test:performance
pytest tests/performance/ -v
```

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready  
**Déploiement** : ✅ **Documenté et Sécurisé**
