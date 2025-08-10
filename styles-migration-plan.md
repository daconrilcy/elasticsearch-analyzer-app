# Styles Migration Plan

## Target tree (proposed)

```
frontend/src/
  components/  # UI shared modules (used by ≥2 components)
  styles/
    utils/_variables.scss
    utils/_mixins.scss
    base/_reset.scss
```

## Component → Module mapping

- **ConfigurationPanel** (`features/components/ConfigurationPanel.tsx`): → `features/components/ConfigurationPanel.module.scss`
  - classes: `.back-button`, `.field-description`, `.form-group`, `.no-params-message`, `.panel-header`, `.params-section`
- **CustomNode** (`features/components/CustomNode.tsx`): → `features/components/CustomNode.module.scss`
  - classes: `.custom-node-`
- **FileListItem** (`features/components/FileListItem.tsx`): → `features/components/FileListItem.module.scss`
  - classes: `.status-`
- **FormExclusiveChoice** (`features/components/form/FormExclusiveChoice.tsx`): → `features/components/form/FormExclusiveChoice.module.scss`
  - classes: `.radio-label`, `.radio-text`
- **ResultPanel** (`features/components/ResultPanel.tsx`): → `features/components/ResultPanel.module.scss`
  - classes: `.placeholder`, `.step-tag`, `.tag-`, `.validation-issues`
- **Sidebar** (`features/components/Sidebar.tsx`): → `features/components/Sidebar.module.scss`
  - classes: `.char-filter`, `.token-filter`, `.tokenizer`
- **TargetNode** (`features/components/TargetNode.tsx`): → `features/components/TargetNode.module.scss`
  - classes: `.nodrag`
- **LoginPage** (`pages/auth/LoginPage.tsx`): → `pages/auth/LoginPage.module.scss`
  - classes: `.login-subtitle`, `.login-title`
- **RegisterPage** (`pages/auth/RegisterPage.tsx`): → `pages/auth/RegisterPage.module.scss`
  - classes: `.login-subtitle`, `.login-title`
- **DatasetDetail** (`pages/DatasetDetail.tsx`): → `pages/DatasetDetail.module.scss`
  - classes: `.card`, `.files-section`, `.loading-fullscreen`, `.mappings-section`

## Shared styles (used by ≥ 2 components) → `src/components/`

- **.login-title** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.login-subtitle** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`

## Tokens

- Move variables to `src/styles/utils/_variables.scss`
- Move mixins/functions to `src/styles/utils/_mixins.scss`
- Keep reset in `src/styles/base/_reset.scss` (if needed)

## Conventions

- SCSS: kebab-case
- TSX (CSS Modules): camelCase with `localsConvention: "camelCase"`