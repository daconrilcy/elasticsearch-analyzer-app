Guide de Déploiement en Production
Ce guide explique comment intégrer l'application Elasticsearch Analyzer (backend FastAPI et frontend React) dans l'environnement docker-compose existant du VPS.

Prérequis
Avant de commencer, assurez-vous d'avoir deux fichiers Dockerfile à la racine de vos dossiers frontend et backend.

backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# En production, on n'utilise pas --reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

frontend/Dockerfile
Ce Dockerfile construit l'application React et la sert avec Nginx.

# Étape 1: Construire l'application React
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2: Servir les fichiers statiques avec Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Vous aurez besoin d'un fichier de configuration Nginx pour gérer le routage
# COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

Étape 1 : Mettre à jour docker-compose.yml sur le VPS
Modifiez votre fichier docker-compose.yml existant pour y ajouter les services backend et frontend, et pour mettre à jour le service elasticsearch.

networks:
  vps_shared_network:
    name: vps_shared_network
    driver: bridge

volumes:
  shared_data:
  # Ajouter un volume pour les données de la BDD de l'analyseur
  analyzer_pg_data:
  # Volume pour les données Prometheus
  prometheus_data:

services:
  nginx:
    # ... (votre configuration nginx existante)
    # Assurez-vous qu'il dépend des nouveaux services
    depends_on:
      - backend
      - frontend
      # ... (autres dépendances)

  # --- NOUVEAU SERVICE : BACKEND ---
  backend:
    build: ./backend # Chemin vers le dossier de votre backend sur le VPS
    container_name: vps_analyzer_backend
    restart: always
    networks:
      - vps_shared_network
    environment:
      # Les variables d'environnement pour la production
      - DATABASE_URL=postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@db:5432/analyzer
      - ES_HOST=http://elasticsearch:9200
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD} # Assurez-vous que cette variable est dans votre .env
    volumes:
      # Le backend a besoin d'accéder aux fichiers pour les lister et en ajouter
      - ./backend/app/es_analysis_files:/app/es_analysis_files
    depends_on:
      - db
      - elasticsearch

  # --- NOUVEAU SERVICE : FRONTEND ---
  frontend:
    build: ./frontend # Chemin vers le dossier de votre frontend sur le VPS
    container_name: vps_analyzer_frontend
    restart: always
    networks:
      - vps_shared_network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.1
    # ... (le reste de votre configuration elasticsearch)
    volumes:
      - shared_data:/data
      # --- LIGNE MODIFIÉE/AJOUTÉE ---
      # Mappe le dossier de l'hôte (où le backend écrit) vers le dossier de config d'ES
      - ./backend/app/es_analysis_files:/usr/share/elasticsearch/config/analysis

  # --- NOUVEAU SERVICE : BASE DE DONNÉES DE L'ANALYSEUR ---
  # (Si vous voulez une BDD séparée, sinon configurez le backend pour utiliser la BDD existante)
  db:
    image: postgres:16
    container_name: vps_analyzer_db
    restart: always
    networks:
      - vps_shared_network
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD} # Utilisez une variable sécurisée
      - POSTGRES_DB=analyzer
    volumes:
      - analyzer_pg_data:/var/lib/postgresql/data

  # --- NOUVEAU SERVICE : PROMETHEUS ---
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: vps_analyzer_prometheus
    restart: always
    networks:
      - vps_shared_network
    ports:
      - "9090:9090"  # Exposer Prometheus pour l'accès externe si nécessaire
    volumes:
      - ./backend/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ... (vos autres services: mercure, redis, etc.)

Étape 2 : Configurer Nginx et Prometheus
Votre nginx.conf doit être mis à jour pour rediriger le trafic vers vos nouveaux services.

**Configuration Prometheus pour la production :**

En production Dockerisée, votre fichier `backend/prometheus.yml` doit utiliser les noms de services Docker au lieu des IPs :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "prometheus-rules.yml"

scrape_configs:
  - job_name: 'elasticsearch-analyzer-api'
    static_configs:
      - targets: ['backend:8000']  # Nom du service Docker au lieu de l'IP
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093  # Nom du service Alertmanager si vous l'ajoutez
```

Ajoutez ces blocs location dans votre configuration de serveur :

# ... dans votre bloc server {} ...

# Redirige toutes les requêtes API vers le service backend
location /api/ {
    proxy_pass http://backend:8000; # 'backend' est le nom du service dans docker-compose
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Sert l'application React pour toutes les autres requêtes
location / {
    proxy_pass http://frontend; # 'frontend' est le nom du service dans docker-compose
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Accès à Prometheus (optionnel, pour la surveillance)
# ⚠️  ATTENTION : En production, protégez cet accès avec une authentification !
location /prometheus/ {
    proxy_pass http://prometheus:9090/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Exemple de protection basique (à adapter selon vos besoins)
    # auth_basic "Prometheus Access";
    # auth_basic_user_file /etc/nginx/.htpasswd;
}

Étape 3 : Déployer
Assurez-vous que le code de votre backend et frontend est présent sur votre VPS.

Créez un fichier .env à côté de votre docker-compose.yml pour définir les variables comme POSTGRES_PASSWORD et ELASTIC_PASSWORD.

Lancez la commande suivante depuis le dossier contenant votre docker-compose.yml :

docker-compose up --build -d

Votre application est maintenant intégrée à votre infrastructure de production.