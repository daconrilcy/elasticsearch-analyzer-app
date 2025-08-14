# Module de Prévisualisation

Ce module gère la prévisualisation des fichiers avec une architecture modulaire et réutilisable.

## Architecture

### Structure des dossiers

```
preview/
├── components/          # Composants UI réutilisables
│   ├── FileHeader.tsx           # En-tête avec métadonnées du fichier
│   ├── PreviewToolbar.tsx       # Barre d'outils avec navigation
│   ├── ChunkNavigation.tsx      # Contrôles de navigation entre chunks
│   ├── PreviewStates.tsx        # Gestion des états (loading, error, etc.)
│   ├── DataContainer.tsx        # Conteneur de données avec DataGrid
│   ├── Modal.tsx                # Modal réutilisable avec plein écran
│   └── FilePreviewPanel.tsx     # Composant principal orchestrateur
├── hooks/               # Logique métier
│   └── useFilePreview.ts        # Hook principal pour la prévisualisation
├── types/               # Types TypeScript
│   └── index.ts                 # Interfaces et types partagés
├── FilePreviewModal.tsx # Modal pour prévisualisation de fichiers
├── DataPreviewModal.tsx # Modal pour prévisualisation de données
└── index.ts             # Exports publics
```

### Principes de conception

1. **Séparation des responsabilités** : Chaque composant a une responsabilité unique
2. **Logique métier dans les hooks** : Toute la logique complexe est extraite dans des hooks personnalisés
3. **Composants réutilisables** : Les composants sont conçus pour être réutilisés dans différents contextes
4. **Types centralisés** : Tous les types sont définis dans un seul endroit
5. **Styles modulaires** : Chaque composant a ses propres styles SCSS

### Composants clés

#### `useFilePreview` Hook
- Gère l'état de la prévisualisation
- Gère la navigation entre chunks
- Gère le cache des chunks
- Gère les connexions SSE
- Fournit des actions pour l'interface utilisateur

#### `FilePreviewPanel`
- Composant principal qui orchestre tous les autres
- Utilise le hook `useFilePreview`
- Gère le rendu conditionnel selon l'état

#### `Modal`
- Composant modal réutilisable
- Support du mode plein écran
- Gestion des clics en dehors pour fermer

### Utilisation

```tsx
import { FilePreviewPanel, FilePreviewModal } from '@features/preview';

// Utilisation directe du panel
<FilePreviewPanel fileId="uuid-du-fichier" />

// Utilisation dans une modal
<FilePreviewModal 
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  fileId="uuid-du-fichier"
  filename="nom-du-fichier.csv"
/>
```

### Avantages de la refactorisation

1. **Maintenabilité** : Code plus facile à maintenir et déboguer
2. **Réutilisabilité** : Composants réutilisables dans d'autres parties de l'application
3. **Testabilité** : Logique métier isolée dans des hooks testables
4. **Performance** : Meilleure gestion des re-renders avec des composants plus petits
5. **Lisibilité** : Code plus lisible et compréhensible

### Migration

Les composants existants (`FilePreviewModal`, `DataPreviewModal`) ont été conservés pour la compatibilité, mais utilisent maintenant la nouvelle architecture interne.

