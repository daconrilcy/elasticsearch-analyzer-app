# 🎯 Mapping Studio V2.2

Le Mapping Studio V2.2 est une interface moderne et performante pour la gestion des mappings Elasticsearch avec des fonctionnalités avancées de validation, transformation et gestion des versions.

## ✨ Fonctionnalités principales

### 🔒 Sécurité & API
- **Validation stricte** : `VITE_API_BASE` requis en production
- **Gestion des tokens** : Stockage sécurisé en mémoire uniquement
- **Headers centralisés** : Content-Type + Authorization automatiques
- **Gestion d'erreurs HTTP** : Messages d'erreur clairs et informatifs

### 🚀 Anti-drift schéma
- **Gestion ETag** : Cache intelligent avec validation des versions
- **Mode hors ligne** : Fonctionnement avec cache local
- **Détection des mises à jour** : Notification automatique des changements
- **Rechargement intelligent** : Mise à jour conditionnelle du schéma

### ⚡ Performance & UX
- **Debounce 500ms** : Optimisation des saisies utilisateur
- **Rate limiting 5 req/s** : Protection contre la surcharge
- **Requêtes annulables** : Gestion des AbortController
- **Virtualisation** : Affichage optimisé des gros volumes de données

### 🎨 Interface utilisateur
- **Drag & Drop** : Réorganisation intuitive des opérations
- **Templates DSL** : Modèles prêts à l'emploi (Contacts, Adresses, Logs)
- **Diff de versions** : Comparaison visuelle des changements
- **Raccourcis clavier** : ⌘+Enter (exécuter), ⌘+S (sauvegarder)

### ♿ Accessibilité
- **ARIA labels** : Support complet des lecteurs d'écran
- **Focus visible** : Navigation clavier optimisée
- **Responsive design** : Adaptation mobile et tablette
- **Toasts unifiés** : Notifications cohérentes

## 🏗️ Architecture

### Structure des composants
```
src/features/mappings/
├── components/
│   ├── SchemaBanner.tsx          # Bannière d'état du schéma
│   ├── DocsPreviewVirtualized.tsx # Prévisualisation virtualisée
│   ├── PipelineDnD.tsx          # Pipeline drag & drop
│   ├── SortableItem.tsx          # Élément triable
│   ├── TemplatesMenu.tsx         # Menu des templates
│   ├── DiffView.tsx              # Comparaison de versions
│   ├── ToastsContainer.tsx       # Conteneur de notifications
│   ├── ShortcutsHelp.tsx         # Aide des raccourcis
│   └── MappingStudioV2Demo.tsx  # Démonstration complète
├── hooks/
│   ├── useSchema.ts              # Gestion du schéma avec cache
│   ├── useDebounce.ts            # Debounce des actions
│   ├── useAbortable.ts           # Gestion des requêtes annulables
│   ├── useShortcuts.ts           # Raccourcis clavier
│   ├── useToasts.ts              # Système de notifications
│   └── rateLimit.ts              # Rate limiting
└── lib/
    └── api.ts                    # Client API centralisé
```

### Hooks disponibles

#### `useSchema()`
Gère le schéma avec cache ETag et mode hors ligne.
```typescript
const { 
  schema, 
  fieldTypes, 
  operations, 
  offline, 
  updated, 
  reload 
} = useSchema();
```

#### `useDebounce(callback, 500)`
Optimise les performances avec un délai de 500ms.
```typescript
const debouncedValidate = useDebounce(validateMapping, 500);
```

#### `useAbortable()`
Gère les requêtes annulables.
```typescript
const { signalNext, abort } = useAbortable();
const signal = signalNext();
const result = await api.validateMapping(mapping, signal);
```

#### `useShortcuts(handlers)`
Gère les raccourcis clavier.
```typescript
useShortcuts({
  onRun: () => handleValidate(),
  onSave: () => handleSave()
});
```

#### `useToasts()`
Système de notifications unifié.
```typescript
const { success, error, info } = useToasts();
success('Mapping validé avec succès');
```

## 🚀 Utilisation

### Composant de démonstration
```tsx
import { MappingStudioV2Demo } from './components';

function App() {
  return <MappingStudioV2Demo />;
}
```

### Intégration personnalisée
```tsx
import { 
  SchemaBanner, 
  TemplatesMenu, 
  PipelineDnD,
  useSchema,
  useToasts 
} from './components';

function MyMappingEditor() {
  const { schema, fieldTypes } = useSchema();
  const { success } = useToasts();

  return (
    <div>
      <SchemaBanner />
      <TemplatesMenu onApply={handleTemplate} />
      <PipelineDnD 
        operations={operations}
        onChange={setOperations}
        renderOperation={renderOp}
      />
    </div>
  );
}
```

## 🔧 Configuration

### Variables d'environnement
```bash
# Obligatoire en production
VITE_API_BASE=http://localhost:8000/api/v1

# Optionnel - Token d'authentification
VITE_AUTH_TOKEN=your_token_here
```

### Dépendances requises
```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0",
  "@dnd-kit/utilities": "^3.2.0",
  "react-window": "^1.8.0"
}
```

## 📱 Responsive Design

Le Mapping Studio V2.2 s'adapte automatiquement aux différentes tailles d'écran :

- **Desktop** : Layout en grille avec sidebar
- **Tablet** : Layout adaptatif avec réorganisation
- **Mobile** : Layout vertical optimisé pour le tactile

## 🎨 Personnalisation

### Thèmes CSS
Tous les composants utilisent des variables CSS pour une personnalisation facile :
```scss
:root {
  --primary-color: #3b82f6;
  --border-color: #e2e8f0;
  --background-color: #f8fafc;
}
```

### Composants extensibles
Chaque composant accepte des props de personnalisation :
```tsx
<SchemaBanner 
  className="custom-banner"
  showOfflineStatus={true}
/>
```

## 🧪 Tests

### Tests unitaires
```bash
npm run test:unit
```

### Tests d'intégration
```bash
npm run test:integration
```

### Tests de performance
```bash
npm run test:performance
```

## 📊 Monitoring

### Métriques de performance
- Temps de chargement du schéma
- Latence des requêtes API
- Utilisation de la mémoire
- Performance du drag & drop

### Logs et diagnostics
- État du cache ETag
- Erreurs de connexion
- Mode hors ligne
- Validation des schémas

## 🔮 Roadmap

### V2.3 (Q2 2024)
- [ ] Support des schémas JSON Schema avancés
- [ ] Validation en temps réel
- [ ] Historique des versions
- [ ] Export/Import de configurations

### V2.4 (Q3 2024)
- [ ] Collaboration en temps réel
- [ ] Workflows de validation
- [ ] Intégration CI/CD
- [ ] Métriques avancées

## 🤝 Contribution

### Guide de développement
1. Fork du repository
2. Création d'une branche feature
3. Implémentation avec tests
4. Pull request avec description détaillée

### Standards de code
- TypeScript strict
- ESLint + Prettier
- Tests unitaires obligatoires
- Documentation JSDoc
- Composants fonctionnels avec hooks

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🆘 Support

### Documentation
- [Guide utilisateur](./USER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [FAQ](./FAQ.md)

### Issues
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discussions](https://github.com/your-repo/discussions)

### Contact
- Email: support@mappingstudio.com
- Slack: #mapping-studio-support
