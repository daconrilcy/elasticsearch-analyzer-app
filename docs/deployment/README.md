# 🚀 **Guide de Déploiement - Elasticsearch Analyzer App**

## 📖 **Vue d'ensemble**

Ce guide couvre tous les aspects du déploiement de l'application Elasticsearch Analyzer App, du développement à la production.

## 🎯 **Environnements Supportés**

- **Développement** : Docker Compose local
- **Staging** : Déploiement intermédiaire
- **Production** : Déploiement en production avec monitoring

## 🐳 **Déploiement avec Docker (Recommandé)**

### **Services Requis**
```bash
# Démarrer tous les services
docker-compose up -d

# Services inclus :
# - PostgreSQL (base de données)
# - Elasticsearch (moteur de recherche)
# - Prometheus (monitoring)
# - Grafana (visualisation)
# - Backend FastAPI
# - Frontend React
```

### **Configuration Docker**
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
  
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3000:3000"
```

## 🔧 **Déploiement Manuel**

### **Backend (FastAPI)**
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
```

### **Frontend (React)**
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
```

## 🌍 **Configuration d'Environnement**

### **Variables Backend**
```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyzer
ELASTICSEARCH_URL=http://localhost:9200
SECRET_KEY=your-secret-key-here
DEBUG=false
LOG_LEVEL=INFO
```

### **Variables Frontend**
```bash
# .env
VITE_API_BASE=http://localhost:8000/api/v1
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
```

## 📊 **Monitoring et Observabilité**

### **Prometheus**
- **URL** : http://localhost:9090
- **Métriques** : Mapping DSL, performance, erreurs
- **Alertes** : Taux d'échec, latence, disponibilité

### **Grafana**
- **URL** : http://localhost:3000
- **Login** : admin/admin
- **Dashboards** : Mapping Studio, performance, erreurs

## 🔒 **Sécurité en Production**

### **Authentification**
- **JWT Tokens** : Gestion des sessions sécurisées
- **Rate Limiting** : Protection contre la surcharge
- **CORS** : Configuration des origines autorisées

### **HTTPS**
```bash
# Configuration Nginx avec SSL
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚨 **Gestion des Incidents**

### **Procédures d'Urgence**
1. **Vérifier les logs** : `docker-compose logs -f`
2. **Contrôler les métriques** : Prometheus + Grafana
3. **Redémarrer les services** : `docker-compose restart`
4. **Restauration** : Base de données + Elasticsearch

### **Contacts d'Urgence**
- **DevOps** : devops@company.com
- **Développement** : dev@company.com
- **Support** : support@company.com

## 📈 **Scaling et Performance**

### **Backend**
- **Workers** : Uvicorn avec multiple workers
- **Cache** : Redis pour les métriques
- **Load Balancer** : Nginx ou HAProxy

### **Frontend**
- **CDN** : Distribution statique
- **Cache** : Headers HTTP appropriés
- **Compression** : Gzip/Brotli

## 🔄 **Mise à Jour et Maintenance**

### **Procédure de Mise à Jour**
```bash
# 1. Sauvegarde
docker-compose exec postgres pg_dump -U postgres analyzer > backup.sql

# 2. Pull des nouvelles images
docker-compose pull

# 3. Mise à jour
docker-compose up -d

# 4. Vérification
docker-compose ps
```

### **Rollback**
```bash
# Revenir à la version précédente
git checkout HEAD~1
docker-compose up -d
```

## 📋 **Checklist de Déploiement**

### **Pré-déploiement**
- [ ] Tests unitaires passent
- [ ] Tests d'intégration validés
- [ ] Base de données migrée
- [ ] Variables d'environnement configurées

### **Déploiement**
- [ ] Services démarrés
- [ ] Health checks OK
- [ ] Métriques collectées
- [ ] Logs surveillés

### **Post-déploiement**
- [ ] Fonctionnalités testées
- [ ] Performance validée
- [ ] Alertes configurées
- [ ] Documentation mise à jour

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready
