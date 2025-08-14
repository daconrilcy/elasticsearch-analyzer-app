# 🎨 **Guide Frontend - Mapping Studio V2.2**

## 📖 **Vue d'ensemble**

Le **Mapping Studio V2.2** est une interface moderne et performante pour la gestion des mappings Elasticsearch avec des fonctionnalités avancées de validation, transformation et gestion des versions.

## ✨ **Fonctionnalités Principales**

### 🔒 **Sécurité & API**
- **Validation stricte** : `VITE_API_BASE` requis en production
- **Gestion des tokens** : Stockage sécurisé en mémoire uniquement
- **Headers centralisés** : Content-Type + Authorization automatiques
- **Gestion d'erreurs HTTP** : Messages d'erreur clairs et informatifs

### 🚀 **Anti-drift schéma**
- **Gestion ETag** : Cache intelligent avec validation des versions
- **Mode hors ligne** : Fonctionnement avec cache local
- **Détection des mises à jour** : Notification automatique des changements
- **Rechargement intelligent** : Mise à jour conditionnelle du schéma

### ⚡ **Performance & UX**
- **Debounce 500ms** : Optimisation des saisies utilisateur
- **Rate limiting 5 req/s** : Protection contre la surcharge
- **Requêtes annulables** : Gestion des AbortController
- **Virtualisation** : Affichage optimisé des gros volumes de données

### 🎨 **Interface utilisateur**
- **Drag & Drop** : Réorganisation intuitive des opérations
- **Templates DSL** : Modèles prêts à l'emploi (Contacts, Adresses, Logs)
- **Diff de versions** : Comparaison visuelle des changements
- **Raccourcis clavier** : ⌘+Enter (exécuter), ⌘+S (sauvegarder)

### ♿ **Accessibilité**
- **ARIA labels** : Support complet des lecteurs d'écran
- **Focus visible** : Navigation clavier optimisée
- **Responsive design** : Adaptation mobile et tablette
- **Toasts unifiés** : Notifications cohérentes

## 🚀 **Démarrage Rapide**

### **Installation des Dépendances**
```bash
cd frontend
npm install
```

### **Configuration d'Environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos paramètres
VITE_API_BASE=http://localhost:8000/api/v1
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
```

### **Lancement en Développement**
```bash
npm run dev
```

### **Build de Production**
```bash
npm run build
```

## 📁 **Architecture du Projet**

```
src/
├── app/                    # Configuration de l'application
├── components/            # Composants partagés
│   ├── datagrid/         # Grille de données virtuelle
│   └── ui/               # Composants UI de base
├── features/              # Fonctionnalités métier
│   ├── analyzers/        # Gestion des analyseurs
│   ├── datasets/         # Gestion des datasets
│   ├── files/            # Gestion des fichiers
│   ├── mappings/         # Mapping Studio (principal)
│   └── preview/          # Prévisualisation des fichiers
├── hooks/                 # Hooks personnalisés
├── lib/                   # Utilitaires et API
├── pages/                 # Pages de l'application
├── shared/                # Code partagé
└── types/                 # Définitions TypeScript
```

## 🔧 **Configuration Avancée**

### **Variables d'Environnement**
```bash
# OBLIGATOIRE en production
VITE_API_BASE=https://your-domain.com/api/v1

# Optionnel
VITE_AUTH_TOKEN=your_token_here
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_METRICS=true
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=info
```

### **Configuration Vite**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable']
        }
      }
    }
  }
})
```

## 🧪 **Tests et Qualité**

### **Tests Unitaires**
```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

### **Tests d'Intégration**
```bash
# Tests des composants
npm run test:components

# Tests des hooks
npm run test:hooks

# Tests des utilitaires
npm run test:utils
```

### **Linting et Formatage**
```bash
# Vérification ESLint
npm run lint

# Correction automatique
npm run lint:fix

# Formatage Prettier
npm run format
```

## 📊 **Performance et Optimisation**

### **Bundle Analysis**
```bash
# Analyse de la taille du bundle
npm run build:analyze

# Rapport de taille
npm run bundle-size
```

### **Optimisations Implémentées**
- **Code Splitting** : Chargement à la demande des fonctionnalités
- **Tree Shaking** : Élimination du code inutilisé
- **Lazy Loading** : Chargement différé des composants
- **Memoization** : Cache des calculs coûteux
- **Virtualisation** : Rendu optimisé des listes longues

### **Métriques de Performance**
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Time to Interactive** : < 3.5s
- **Bundle Size** : < 500KB gzippé

## 🎨 **Système de Design**

### **Composants UI**
```typescript
// Utilisation des composants
import { Button, FormField, Badge } from '@/components/ui';

<Button variant="primary" size="large">
  Créer un Mapping
</Button>

<FormField
  label="Nom du mapping"
  error={errors.name}
  required
>
  <input type="text" {...register('name')} />
</FormField>
```

### **Thème et Styles**
```scss
// Variables CSS personnalisées
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

## 🔌 **Intégration API**

### **Client API**
```typescript
// Utilisation du client API
import { apiClient } from '@/lib/api';

// Validation d'un mapping
const result = await apiClient.mappings.validate({
  mapping: mappingData,
  data: testData
});

// Compilation d'un mapping
const compiled = await apiClient.mappings.compile({
  mapping: mappingData
});
```

### **Gestion des Erreurs**
```typescript
// Gestion centralisée des erreurs
try {
  const result = await apiClient.mappings.validate(data);
  return result;
} catch (error) {
  if (error.status === 400) {
    showValidationErrors(error.details);
  } else if (error.status === 500) {
    showServerError();
  } else {
    showGenericError();
  }
}
```

## 🚀 **Déploiement**

### **Déploiement Automatique**
```bash
# Script Windows
.\deploy-production.bat

# Script Unix
./deploy-production.sh
```

### **Déploiement Manuel**
```bash
# Build de production
npm run build

# Copier le dossier dist
cp -r dist/* /var/www/html/

# Configuration Nginx
sudo nginx -s reload
```

### **Déploiement Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📱 **Responsive Design**

### **Breakpoints**
```scss
// Mobile First
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;
$wide: 1440px;

// Media queries
@media (min-width: $tablet) {
  .container {
    max-width: 720px;
  }
}
```

### **Composants Adaptatifs**
- **Navigation** : Menu hamburger sur mobile
- **Grille** : Colonnes adaptatives
- **Formulaires** : Layout vertical sur mobile
- **Modales** : Plein écran sur mobile

## 🔍 **Debug et Développement**

### **Outils de Développement**
```bash
# Mode debug
npm run dev:debug

# Inspection du bundle
npm run build:inspect

# Profiling des performances
npm run profile
```

### **Logs et Monitoring**
```typescript
// Logging structuré
import { logger } from '@/lib/logger';

logger.info('Mapping créé', {
  id: mapping.id,
  name: mapping.name,
  version: mapping.version
});

logger.error('Erreur de validation', {
  error: error.message,
  mapping: mapping.id
});
```

## 📚 **Documentation des Composants**

### **Mapping Studio**
- **ConfigurationPanel** : Configuration des paramètres
- **MappingCanvas** : Éditeur visuel des mappings
- **OperationLibrary** : Bibliothèque d'opérations
- **ValidationResults** : Affichage des résultats de validation

### **Gestion des Fichiers**
- **FileList** : Liste des fichiers avec pagination
- **FileUpload** : Upload avec drag & drop
- **FilePreview** : Prévisualisation des contenus
- **ChunkNavigation** : Navigation dans les gros fichiers

## 🔗 **Ressources et Liens**

### **Documentation Externe**
- [React](https://react.dev/) - Framework UI
- [TypeScript](https://www.typescriptlang.org/) - Langage typé
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Framework de tests

### **Outils de Développement**
- **DevTools** : React Developer Tools
- **Profiling** : React Profiler
- **Debugging** : Source Maps
- **Hot Reload** : Vite HMR

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready
