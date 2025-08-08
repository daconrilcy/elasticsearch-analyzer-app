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

- **App** (`App.tsx`): → `App.module.scss`
  - classes: `.app-container`, `.config-panel`, `.flow-editor-main`, `.loading-fullscreen`, `.main-content`, `.page-container`, `.page-content`, `.placeholder-panel`
- **ConfigurationPanel** (`features/components/ConfigurationPanel.tsx`): → `features/components/ConfigurationPanel.module.scss`
  - classes: `.back-button`, `.config-panel`, `.delete-button`, `.field-description`, `.form-group`, `.meta-item`, `.meta-label`, `.meta-value`, `.no-params-message`, `.node-meta`, `.panel-content`, `.panel-footer`, `.panel-header`, `.params-section`
- **CreateMappingModal** (`features/components/CreateMappingModal.tsx`): → `features/components/CreateMappingModal.module.scss`
  - classes: `.close-button`, `.form-input`, `.modal-body`, `.modal-content`, `.modal-footer`, `.modal-header`, `.modal-overlay`, `.primary`, `.react-flow-container`
- **CustomNode** (`features/components/CustomNode.tsx`): → `features/components/CustomNode.module.scss`
  - classes: `.custom-node`, `.custom-node-`, `.input-textarea`, `.node-content`, `.node-header`
- **DataPreviewModal** (`features/components/DataPreviewModal.tsx`): → `features/components/DataPreviewModal.module.scss`
  - classes: `.close-button`, `.modal-body`, `.modal-content`, `.modal-overlay`
- **FileList** (`features/components/FileList.tsx`): → `features/components/FileList.module.scss`
  - classes: `.files-section`
- **FileListItem** (`features/components/FileListItem.tsx`): → `features/components/FileListItem.module.scss`
  - classes: `.button`, `.delete-button`, `.details-actions`, `.download-button`, `.file-actions`, `.file-hash`, `.file-info`, `.file-item-details`, `.file-item-error`, `.file-item-main`, `.file-list-item`, `.file-meta`, `.file-name`, `.status-`
- **FormCheckboxGroup** (`features/components/form/FormCheckboxGroup.tsx`): → `features/components/form/FormCheckboxGroup.module.scss`
  - classes: `.checkbox-custom`, `.checkbox-group-container`, `.checkbox-label`, `.checkbox-text`
- **FormExclusiveChoice** (`features/components/form/FormExclusiveChoice.tsx`): → `features/components/form/FormExclusiveChoice.module.scss`
  - classes: `.exclusive-choice-container`, `.exclusive-choice-content`, `.exclusive-choice-radios`, `.radio-label`, `.radio-text`
- **FormFile** (`features/components/form/FormFile.tsx`): → `features/components/form/FormFile.module.scss`
  - classes: `.clear-button`, `.file-display`, `.file-input-toggle`, `.file-name`, `.file-placeholder`, `.file-select`, `.file-upload-container`, `.form-file-wrapper`, `.toggle-button`
- **FormSwitch** (`features/components/form/FormSwitch.tsx`): → `features/components/form/FormSwitch.module.scss`
  - classes: `.switch-label`, `.switch-slider`, `.switch-text`
- **ResultPanel** (`features/components/ResultPanel.tsx`): → `features/components/ResultPanel.module.scss`
  - classes: `.analysis-step`, `.initial-text`, `.loading-container`, `.placeholder`, `.result-panel`, `.result-panel-header`, `.step-header`, `.step-name-text`, `.step-output`, `.step-tag`, `.steps-container`, `.steps-container-scrollable`, `.tag-`, `.token`, `.validation-issues`
- **Sidebar** (`features/components/Sidebar.tsx`): → `features/components/Sidebar.module.scss`
  - classes: `.char-filter`, `.sidebar`, `.sidebar-content-scrollable`, `.sidebar-description`, `.sidebar-node`, `.sidebar-section`, `.sidebar-section-title`, `.title-icon`, `.token-filter`, `.tokenizer`
- **StatusBadge** (`features/components/StatusBadge.tsx`): → `features/components/StatusBadge.module.scss`
  - classes: `.icon`, `.status-badge`
- **TargetNode** (`features/components/TargetNode.tsx`): → `features/components/TargetNode.module.scss`
  - classes: `.nodrag`
- **Header** (`features/layout/Header.tsx`): → `features/layout/Header.module.scss`
  - classes: `.action-button`, `.app-header`, `.logout-button`, `.page-title`, `.primary`, `.project-actions`, `.project-actions-placeholder`, `.project-selector`, `.project-title`, `.user-info`, `.username`
- **IconSidebar** (`features/layout/IconSidebar.tsx`): → `features/layout/IconSidebar.module.scss`
  - classes: `.icon-sidebar`, `.nav-button`, `.nav-separator`
- **LoginPage** (`pages/auth/LoginPage.tsx`): → `pages/auth/LoginPage.module.scss`
  - classes: `.form-group`, `.login-button`, `.login-form-wrapper`, `.login-page-container`, `.login-subtitle`, `.login-title`, `.switch-form-link`
- **RegisterPage** (`pages/auth/RegisterPage.tsx`): → `pages/auth/RegisterPage.module.scss`
  - classes: `.form-group`, `.login-button`, `.login-form-wrapper`, `.login-page-container`, `.login-subtitle`, `.login-title`, `.switch-form-link`
- **DatasetDetail** (`pages/DatasetDetail.tsx`): → `pages/DatasetDetail.module.scss`
  - classes: `.card`, `.dataset-hub`, `.files-section`, `.loading-fullscreen`, `.mappings-section`
- **DatasetListPage** (`pages/DatasetListPage.tsx`): → `pages/DatasetListPage.module.scss`
  - classes: `.dataset-list-page`, `.modal-content`, `.modal-footer`, `.modal-overlay`, `.primary`

## Shared styles (used by ≥ 2 components) → `src/components/`

- **.loading-fullscreen** → components: `App.tsx`, `pages/DatasetDetail.tsx`
- **.config-panel** → components: `App.tsx`, `features/components/ConfigurationPanel.tsx`
- **.files-section** → components: `features/components/FileList.tsx`, `pages/DatasetDetail.tsx`
- **.modal-overlay** → components: `features/components/CreateMappingModal.tsx`, `features/components/DataPreviewModal.tsx`, `pages/DatasetListPage.tsx`
- **.modal-content** → components: `features/components/CreateMappingModal.tsx`, `features/components/DataPreviewModal.tsx`, `pages/DatasetListPage.tsx`
- **.modal-footer** → components: `features/components/CreateMappingModal.tsx`, `pages/DatasetListPage.tsx`
- **.primary** → components: `features/components/CreateMappingModal.tsx`, `features/layout/Header.tsx`, `pages/DatasetListPage.tsx`
- **.form-group** → components: `features/components/ConfigurationPanel.tsx`, `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.delete-button** → components: `features/components/ConfigurationPanel.tsx`, `features/components/FileListItem.tsx`
- **.close-button** → components: `features/components/CreateMappingModal.tsx`, `features/components/DataPreviewModal.tsx`
- **.modal-body** → components: `features/components/CreateMappingModal.tsx`, `features/components/DataPreviewModal.tsx`
- **.file-name** → components: `features/components/FileListItem.tsx`, `features/components/form/FormFile.tsx`
- **.login-page-container** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.login-form-wrapper** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.login-title** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.login-subtitle** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.login-button** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **.switch-form-link** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`

## Tokens

- Move variables to `src/styles/utils/_variables.scss`
- Move mixins/functions to `src/styles/utils/_mixins.scss`
- Keep reset in `src/styles/base/_reset.scss` (if needed)

## Conventions

- SCSS: kebab-case
- TSX (CSS Modules): camelCase with `localsConvention: "camelCase"`