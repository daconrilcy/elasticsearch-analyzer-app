# Guide d’écriture des styles (CSS Modules + SCSS)

## Structure
- `frontend/src/styles/abstracts/` : tokens SCSS
  - `/_variables.scss` couleurs, typos, espacements, z-index, radius
  - `/_mixins.scss` mixins/fonctions
- `frontend/src/**/NomDuComposant.module.scss` : styles locaux au composant
- `frontend/src/components/` (option) : modules partagés réutilisés ≥ 2 composants
- `frontend/src/styles/index.scss` : global minimal (reset, typographie, utilitaires globaux spécifiques)

## Conventions
- SCSS: kebab-case pour les classes
- TSX (CSS Modules): camelCase via `localsConvention: "camelCase"`
- Un fichier par composant: `NomDuComposant.module.scss`
- N’utilisez pas d’IDs; évitez d’augmenter la spécificité inutilement
- Préférez `:where()` pour encapsuler et réduire la spécificité si besoin

## Tokens (exemples)
- Couleurs: `$text-primary`, `$text-secondary`, `$accent-color`, `$bg-main`, `$bg-panel`, `$border-color`, `$success-color`, `$danger-color`
- Typo: `$font-family-sans`, `$font-weight-medium`, `$font-weight-bold`
- Spacing: `$spacing-unit`
- Radius: `$border-radius-md`, `$border-radius-lg`, `$border-radius-xl`, `$border-radius-node`

## Règles d’écriture
- Pas de styles transverses entre composants; composez via classes locales
- Utilisez les tokens; évitez les valeurs en dur
- Évitez les sélecteurs imbriqués profonds (>2 niveaux)
- Centralisez les patterns récurrents en mixins (ex: ombres, boutons, panneaux)
- Privilégiez les layouts flex/grid à l’intérieur du module lorsque nécessaire

## Composition et extension
- CSS Modules: combinez des classes via `className={`${styles.a} ${styles.b}`}`
- Pour partager, créez un module partagé (ex: `components/Button.module.scss`) puis importez ses classes
- Option: documenter une classe utilitaire globale rare dans `index.scss` si justifié (ex: `.reactflow-wrapper`)

## Accessibilité / Responsif
- Respectez les contrastes; gardez les couleurs textuelles via tokens
- Prévoyez des `:focus-visible` sur les éléments interactifs
- Utilisez des médias simples ou des conteneurs fluides; évitez les valeurs fixes

## Process qualité
- Build + typecheck + lint
- Audit: `node scripts/style-audit.mjs`
- Inventaire & checklist visuelle:
  - `post-migration-inventory.md`
  - `visual-regression-checklist.md`
- Bundle size: `node scripts/bundle-size-report.mjs`


