#!/bin/bash

echo "🚀 Configuration de l'environnement de développement..."
echo

# Vérifier si .env existe déjà
if [ -f .env ]; then
    echo "⚠️  Le fichier .env existe déjà"
    echo
    echo "Contenu actuel :"
    cat .env
    echo
    read -p "Voulez-vous le remplacer ? (y/N): " choice
    if [[ $choice =~ ^[Yy]$ ]]; then
        echo "✅ Remplacement du fichier .env..."
    else
        echo "❌ Opération annulée"
        exit 0
    fi
fi

echo
echo "📝 Création du fichier .env pour le développement..."
echo

# Créer le fichier .env
cat > .env << 'EOF'
# Development Environment Variables for Mapping Studio V2.2
# This file should not be committed to version control

# API Configuration (REQUIRED)
VITE_API_BASE=http://localhost:8000

# Authentication (Optional)
VITE_AUTH_TOKEN=

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
VITE_ENABLE_ANALYTICS=false

# Performance Settings
VITE_DEBOUNCE_DELAY=500
VITE_RATE_LIMIT_REQUESTS=5
VITE_RATE_LIMIT_WINDOW=1000

# Cache Settings
VITE_CACHE_TTL=300000
VITE_OFFLINE_CACHE_SIZE=50

# Build Information
VITE_APP_VERSION=2.2.0
VITE_BUILD_DATE=$(date +%Y-%m-%d)
VITE_ENVIRONMENT=development
EOF

echo "✅ Fichier .env créé avec succès !"
echo
echo "📋 Contenu du fichier :"
echo
cat .env
echo
echo "🚀 Vous pouvez maintenant démarrer l'application avec : npm run dev"
echo
