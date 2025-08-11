# DataGridVirtual - Composant de tableau amélioré

## Vue d'ensemble

Le composant `DataGridVirtual` a été entièrement refactorisé pour offrir une meilleure expérience utilisateur lors de l'affichage de données avec de nombreuses colonnes. Il gère automatiquement la largeur des colonnes, le défilement horizontal et l'affichage du contenu long.

## 🚀 Fonctionnalités principales

### 1. **Largeur des colonnes adaptative**
- **Calcul automatique** : La largeur de chaque colonne est calculée dynamiquement basée sur son contenu
- **Limites configurables** : Largeur minimale et maximale personnalisables
- **Optimisation intelligente** : Différents types de données (string, number, boolean, object) ont des largeurs optimisées

### 2. **Gestion du défilement horizontal**
- **Défilement fluide** : Barre de défilement horizontale personnalisée et responsive
- **En-têtes fixes** : Les en-têtes de colonnes restent visibles lors du défilement
- **Indicateurs visuels** : Séparateurs entre colonnes pour une meilleure lisibilité

### 3. **Affichage du contenu optimisé**
- **Troncature intelligente** : Contenu long affiché avec ellipsis (...) et tooltips au survol
- **Types de données** : Gestion spécialisée pour chaque type (string, number, boolean, object)
- **Tooltips contextuels** : Affichage du contenu complet au survol des cellules tronquées

### 4. **Interface utilisateur moderne**
- **Scrollbars personnalisées** : Design moderne avec couleurs et animations
- **Alternance des couleurs** : Lignes alternées pour une meilleure lisibilité
- **États de survol** : Effets visuels au survol des lignes et cellules

## 📋 Props du composant

```typescript
interface DataGridVirtualProps {
  data: Record<string, any>[];           // Données à afficher
  className?: string;                    // Classe CSS optionnelle
  height?: number;                       // Hauteur du tableau (défaut: 400px)
  maxColumnWidth?: number;               // Largeur maximale des colonnes (défaut: 300px)
  minColumnWidth?: number;               // Largeur minimale des colonnes (défaut: 120px)
}
```

## 🎯 Utilisation

### Utilisation basique
```tsx
import { DataGridVirtual } from '@components/datagrid';

<DataGridVirtual
  data={myData}
  height={500}
/>
```

### Utilisation avancée avec largeurs personnalisées
```tsx
<DataGridVirtual
  data={myData}
  height={600}
  maxColumnWidth={400}
  minColumnWidth={100}
/>
```

## 🔧 Algorithme de calcul des largeurs

### 1. **Analyse du contenu**
- **Noms de colonnes** : Largeur de base basée sur la longueur du nom
- **Chaînes** : Largeur proportionnelle à la longueur du contenu (max 8px par caractère)
- **Nombres** : Largeur fixe de 80px (optimisée pour la lisibilité)
- **Booléens** : Largeur fixe de 60px (affichage compact)
- **Objets** : Largeur basée sur la représentation JSON (max 6px par caractère)

### 2. **Application des limites**
- **Largeur minimale** : Garantit une lisibilité minimale
- **Largeur maximale** : Évite que les colonnes deviennent trop larges
- **Padding** : Ajout de 32px pour l'espacement interne

### 3. **Optimisation**
- **Mise en cache** : Calculs mémorisés avec `useMemo`
- **Performance** : Analyse uniquement des données visibles
- **Adaptation** : Ajustement automatique lors du changement de données

## 🎨 Personnalisation des styles

### Scrollbars personnalisées
```scss
&::-webkit-scrollbar {
  height: 8px;  // Scrollbar horizontale
  width: 8px;   // Scrollbar verticale
}

&::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  
  &:hover {
    background: #94a3b8;
  }
}
```

### Tooltips au survol
```scss
&:hover {
  span[data-has-tooltip="true"]::before {
    content: attr(title);
    position: absolute;
    background: #1f2937;
    color: white;
    // ... autres styles
  }
}
```

## 📱 Responsive Design

- **Grille adaptative** : Les contrôles s'adaptent automatiquement à la largeur d'écran
- **Défilement tactile** : Support natif du défilement tactile sur mobile
- **Breakpoints** : Adaptation automatique pour les écrans de petite taille

## 🧪 Composant de démonstration

Un composant `DataGridVirtualDemo` est disponible pour tester toutes les fonctionnalités :

```tsx
import { DataGridVirtualDemo } from '@components/datagrid';

// Affiche une interface interactive pour tester :
// - Nombre de lignes/colonnes
// - Largeurs min/max des colonnes
// - Différents types de données
// - Comportement du défilement
```

## 🔄 Migration depuis l'ancienne version

### Changements de props
```tsx
// ❌ Ancien (plus de largeur fixe)
<DataGridVirtual data={data} />

// ✅ Nouveau (largeurs adaptatives)
<DataGridVirtual 
  data={data}
  maxColumnWidth={300}  // Optionnel
  minColumnWidth={120}  // Optionnel
/>
```

### Comportement
- **Avant** : Toutes les colonnes avaient la même largeur fixe
- **Maintenant** : Chaque colonne s'adapte à son contenu avec des limites configurables

## 🚀 Améliorations futures possibles

- [ ] **Tri des colonnes** : Ajout de fonctionnalités de tri
- [ ] **Filtrage** : Filtres par colonne
- [ ] **Sélection** : Sélection multiple de lignes
- [ ] **Édition** : Édition inline des cellules
- [ ] **Export** : Export des données affichées
- [ ] **Virtualisation** : Rendu virtuel pour de très grandes quantités de données

## 📊 Performance

- **Rendu optimisé** : Utilisation de `useMemo` pour éviter les recalculs inutiles
- **Défilement fluide** : Gestion native du défilement avec CSS
- **Mémoire** : Pas de stockage des données en double
- **Scalabilité** : Performance maintenue même avec de nombreuses colonnes

## 🤝 Contribution

Pour contribuer à l'amélioration de ce composant :

1. **Tests** : Ajoutez des tests pour les nouvelles fonctionnalités
2. **Documentation** : Mettez à jour ce README si nécessaire
3. **Accessibilité** : Vérifiez la conformité WCAG
4. **Performance** : Testez avec de grandes quantités de données

