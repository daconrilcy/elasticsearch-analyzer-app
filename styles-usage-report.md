# Styles Usage Report

## Classes used ↔ components

- **back-button**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **card**: selectors in `src/pages/DatasetDetail.module.scss` → components: `pages/DatasetDetail.tsx`
- **char-filter**: selectors in _not found in SCSS_ → components: `features/components/Sidebar.tsx`
- **config-panel**: selectors in _not found in SCSS_ → components: `App.tsx`
- **custom-node-**: selectors in _not found in SCSS_ → components: `features/components/CustomNode.tsx`
- **field-description**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **files-section**: selectors in `src/features/components/FileList.module.scss` → components: `pages/DatasetDetail.tsx`
- **form-group**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **loading-fullscreen**: selectors in `src/App.module.scss` → components: `pages/DatasetDetail.tsx`
- **login-subtitle**: selectors in _not found in SCSS_ → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **login-title**: selectors in _not found in SCSS_ → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **mappings-section**: selectors in `src/features/components/FileList.module.scss` → components: `pages/DatasetDetail.tsx`
- **no-params-message**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **nodrag**: selectors in _not found in SCSS_ → components: `features/components/TargetNode.tsx`
- **panel-header**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **params-section**: selectors in _not found in SCSS_ → components: `features/components/ConfigurationPanel.tsx`
- **placeholder**: selectors in `src/features/components/ResultPanel.module.scss` → components: `features/components/ResultPanel.tsx`
- **placeholder-panel**: selectors in _not found in SCSS_ → components: `App.tsx`
- **radio-label**: selectors in _not found in SCSS_ → components: `features/components/form/FormExclusiveChoice.tsx`
- **radio-text**: selectors in _not found in SCSS_ → components: `features/components/form/FormExclusiveChoice.tsx`
- **status-**: selectors in _not found in SCSS_ → components: `features/components/FileListItem.tsx`
- **step-tag**: selectors in `src/features/components/ResultPanel.module.scss` → components: `features/components/ResultPanel.tsx`
- **tag-**: selectors in _not found in SCSS_ → components: `features/components/ResultPanel.tsx`
- **token-filter**: selectors in _not found in SCSS_ → components: `features/components/Sidebar.tsx`
- **tokenizer**: selectors in _not found in SCSS_ → components: `features/components/Sidebar.tsx`
- **validation-issues**: selectors in _not found in SCSS_ → components: `features/components/ResultPanel.tsx`

## Classes defined but not used

- analysis-step
- backButton
- button-secondary
- button-success
- checkbox-group-container
- checkbox-label
- clear-button
- closeButton
- configPanel
- danger
- dataset-hub
- dataset-list-page
- deleteButton
- error-text
- exclusive-choice-container
- exclusive-choice-content
- exclusive-choice-radios
- fieldDescription
- file-actions
- file-display
- file-info
- file-input-text
- file-input-toggle
- file-item
- file-item-details
- file-item-error
- file-item-main
- file-item__name
- file-item__remove-btn
- file-item__size
- file-placeholder
- file-select
- file-upload-container
- flow-editor-main
- form-file-wrapper
- formGroup
- formInput
- ghost
- initial-text
- input-textarea
- loading-container
- login-form-wrapper
- login-page-container
- logoutButton
- main-content
- metaItem
- metaLabel
- metaValue
- modalBody
- modalContent
- modalFooter
- modalHeader
- modalOverlay
- navButton
- navSeparator
- node-content
- node-header
- nodeMeta
- page-container
- page-content
- pageTitle
- panelContent
- panelFooter
- panelHeader
- paramsSection
- placeholderPanel
- primary
- project-selector
- projectActions
- projectActionsPlaceholder
- projectTitle
- react-flow__edge-path
- react-flow__handle
- react-flow__node.react-flow__node-input
- react-flow__node.react-flow__node-output
- result-panel
- result-panel-header
- select
- sidebar-content-scrollable
- sidebar-description
- sidebar-node
- sidebar-section
- sidebar-section-title
- step-header
- step-name-text
- step-output
- steps-container
- steps-container-scrollable
- switch-label
- switch-slider
- switch-text
- tag-char-filter
- tag-default
- tag-error
- tag-input
- tag-token-filter
- tag-tokenizer
- titleIcon
- token
- upload-button
- upload-button:disabled
- upload-card__subtitle
- upload-card__title
- userInfo
- username

## Classes used but not defined in local SCSS

- **config-panel** → components: `App.tsx`
- **placeholder-panel** → components: `App.tsx`
- **no-params-message** → components: `features/components/ConfigurationPanel.tsx`
- **form-group** → components: `features/components/ConfigurationPanel.tsx`
- **field-description** → components: `features/components/ConfigurationPanel.tsx`
- **panel-header** → components: `features/components/ConfigurationPanel.tsx`
- **back-button** → components: `features/components/ConfigurationPanel.tsx`
- **params-section** → components: `features/components/ConfigurationPanel.tsx`
- **custom-node-** → components: `features/components/CustomNode.tsx`
- **status-** → components: `features/components/FileListItem.tsx`
- **validation-issues** → components: `features/components/ResultPanel.tsx`
- **tag-** → components: `features/components/ResultPanel.tsx`
- **char-filter** → components: `features/components/Sidebar.tsx`
- **tokenizer** → components: `features/components/Sidebar.tsx`
- **token-filter** → components: `features/components/Sidebar.tsx`
- **nodrag** → components: `features/components/TargetNode.tsx`
- **login-title** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **login-subtitle** → components: `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`
- **radio-label** → components: `features/components/form/FormExclusiveChoice.tsx`
- **radio-text** → components: `features/components/form/FormExclusiveChoice.tsx`

## Variables

- Total defined: 70
- Orphan variables (defined never referenced): 0

## Mixins

- Total mixins: 3
- Orphan mixins (defined never @include): 0

## Duplicate rules across different files (same declarations)

- (.configPanel in `src/App.module.scss`) ↔ (.placeholderPanel in `src/App.module.scss`) ↔ (.pageTitle in `src/pages/DatasetDetail.module.scss`) ↔ (.projectTitle in `src/pages/DatasetDetail.module.scss`) ↔ (.projectTitle in `src/features/layout/Header.module.scss`) ↔ (.projectActions in `src/features/layout/Header.module.scss`) ↔ (.userInfo in `src/features/layout/Header.module.scss`) ↔ (.username in `src/features/layout/Header.module.scss`) ↔ (.logoutButton in `src/features/layout/Header.module.scss`) ↔ (.pageTitle in `src/features/layout/Header.module.scss`) ↔ (.projectActionsPlaceholder in `src/features/layout/Header.module.scss`) ↔ (.navButton in `src/features/layout/IconSidebar.module.scss`) ↔ (.panelHeader in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.backButton in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.panelContent in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.nodeMeta in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.metaItem in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.metaLabel in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.metaValue in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.formGroup in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.paramsSection in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.fieldDescription in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.panelFooter in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.deleteButton in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.placeholderPanel in `src/features/components/ConfigurationPanel.module.scss`) ↔ (.files-section in `src/features/components/FileList.module.scss`) ↔ (.mappings-section in `src/features/components/FileList.module.scss`)