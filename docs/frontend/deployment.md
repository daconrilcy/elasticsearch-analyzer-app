# 🚀 Guide de Déploiement Production - Mapping Studio V2.2

## 📋 Prérequis

### Système
- **OS** : Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM** : Minimum 4GB, Recommandé 8GB+
- **CPU** : 2+ cores
- **Stockage** : 20GB+ libre
- **Docker** : 20.10+ et Docker Compose 2.0+

### Domaine et SSL
- **Domaine** : Votre domaine configuré (ex: mapping.yourcompany.com)
- **SSL** : Certificat Let's Encrypt ou commercial
- **DNS** : Records A/CNAME pointant vers votre serveur

## 🔧 Configuration de l'Environnement

### 1. Variables d'Environnement

Créez le fichier `.env.production.local` :

```bash
# API Configuration (OBLIGATOIRE)
VITE_API_BASE=https://your-domain.com/api/v1

# Authentication
VITE_AUTH_TOKEN=your_production_token

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
VITE_ENABLE_ANALYTICS=false

# Performance
VITE_DEBOUNCE_DELAY=500
VITE_RATE_LIMIT_REQUESTS=5
VITE_RATE_LIMIT_WINDOW=1000
```

### 2. Configuration Backend

Assurez-vous que votre backend FastAPI est configuré avec :

```python
# CORS
CORS_ORIGINS = ["https://your-domain.com"]

# Rate Limiting
RATE_LIMIT_REQUESTS = 5
RATE_LIMIT_WINDOW = 1000

# Security Headers
SECURE_HEADERS = True
```

## 🐳 Déploiement avec Docker

### 1. Build de Production

```bash
# Build optimisé
npm run build

# Ou utilisez le script personnalisé
node build-production.js
```

### 2. Déploiement Docker

```bash
# Démarrer tous les services
docker-compose -f docker-compose.production.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.production.yml ps

# Voir les logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Vérification du Déploiement

```bash
# Health check
curl http://localhost/health

# Vérifier le frontend
curl http://localhost

# Vérifier l'API
curl http://localhost:8000/health
```

## 🌐 Configuration Nginx

### 1. Installation Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Configuration

```bash
# Copier la configuration
sudo cp nginx.conf /etc/nginx/sites-available/mapping-studio

# Activer le site
sudo ln -s /etc/nginx/sites-available/mapping-studio /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 3. Configuration SSL avec Let's Encrypt

```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring et Observabilité

### 1. Prometheus Configuration

Créez `monitoring/prometheus.yml` :

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mapping-studio-frontend'
    static_configs:
      - targets: ['localhost:80']
    metrics_path: /metrics

  - job_name: 'mapping-studio-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: /metrics

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### 2. Grafana Dashboards

Importez les dashboards depuis `monitoring/grafana/dashboards/` :

- **Frontend Metrics** : Performance, erreurs, utilisateurs
- **Backend API** : Latence, débit, erreurs
- **Infrastructure** : CPU, mémoire, réseau

## 🔒 Sécurité

### 1. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Sécurité des Conteneurs

```bash
# Mise à jour des images
docker-compose -f docker-compose.production.yml pull

# Scan de sécurité
docker scan mapping-studio-v2.2-frontend
```

### 3. Variables Sensibles

```bash
# Utilisez Docker Secrets ou un gestionnaire de secrets
echo "your_secret_password" | docker secret create db_password -

# Ou utilisez des fichiers .env sécurisés
chmod 600 .env.production.local
```

## 📈 Performance et Optimisation

### 1. CDN Configuration

```bash
# Cloudflare
# 1. Ajoutez votre domaine à Cloudflare
# 2. Configurez les règles de cache
# 3. Activez la compression Brotli
# 4. Configurez les règles de sécurité
```

### 2. Cache Redis

```bash
# Vérifier la performance Redis
redis-cli -h localhost -p 6379 info memory

# Configuration optimisée
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 3. Base de Données

```bash
# Optimisation PostgreSQL
# Ajoutez dans postgresql.conf :
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## 🚨 Gestion des Incidents

### 1. Logs et Debugging

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/mapping-studio.error.log

# Logs Docker
docker-compose -f docker-compose.production.yml logs -f

# Logs Application
docker exec mapping-studio-v2.2-frontend tail -f /var/log/nginx/error.log
```

### 2. Monitoring des Erreurs

```bash
# Vérifier les erreurs 5xx
grep " 5[0-9][0-9] " /var/log/nginx/access.log

# Vérifier la latence
grep "request_time" /var/log/nginx/access.log | awk '{print $NF}'
```

### 3. Rollback

```bash
# Rollback vers une version précédente
docker tag mapping-studio-v2.2-frontend:previous mapping-studio-v2.2-frontend:latest

# Redémarrer le service
docker-compose -f docker-compose.production.yml restart mapping-studio-frontend
```

## 🔄 Mise à Jour et Maintenance

### 1. Mise à Jour Automatique

```bash
# Script de mise à jour
#!/bin/bash
cd /opt/mapping-studio
git pull origin main
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### 2. Sauvegarde

```bash
# Sauvegarde de la base de données
docker exec mapping-studio-v2.2-db pg_dump -U mapping_user mapping_studio > backup.sql

# Sauvegarde des volumes Docker
docker run --rm -v mapping-studio_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### 3. Maintenance Planifiée

```bash
# Créer un cron job pour la maintenance
0 2 * * 0 /opt/mapping-studio/scripts/maintenance.sh
```

## 📱 Tests de Production

### 1. Tests de Charge

```bash
# Installation de k6
curl -L https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz | tar xz

# Test de charge
./k6 run load-test.js
```

### 2. Tests de Fonctionnalité

```bash
# Tests E2E avec Playwright
npm run test:e2e:production

# Tests de régression visuelle
npm run test:visual:production
```

## 🎯 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] SSL/TLS configuré
- [ ] Firewall configuré
- [ ] Monitoring activé
- [ ] Sauvegardes configurées
- [ ] Tests de production effectués
- [ ] Documentation mise à jour
- [ ] Équipe formée
- [ ] Procédures d'urgence documentées

## 🆘 Support et Contact

### En cas de problème :

1. **Vérifiez les logs** : `docker-compose logs -f`
2. **Vérifiez la santé** : `curl http://localhost/health`
3. **Vérifiez les ressources** : `docker stats`
4. **Consultez la documentation** : [README_V2.2.md](./README_V2.2.md)

### Contact d'urgence :
- **Email** : support@mappingstudio.com
- **Slack** : #mapping-studio-support
- **Documentation** : [MISSION_ACCOMPLISHED.md](./MISSION_ACCOMPLISHED.md)

---

**🎉 Félicitations ! Votre Mapping Studio V2.2 est maintenant en production !**

Le système est configuré avec :
- ✅ **Sécurité renforcée** (SSL, headers, rate limiting)
- ✅ **Performance optimisée** (cache, compression, CDN)
- ✅ **Monitoring complet** (Prometheus, Grafana, logs)
- ✅ **Haute disponibilité** (Docker, restart policies)
- ✅ **Maintenance automatisée** (backups, updates)
