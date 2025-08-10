# Post Migration Inventory

## CSS Module files (added)
- `frontend/src/App.module.scss`
- `frontend/src/components/Button.module.scss`
- `frontend/src/components/Modal.module.scss`
- `frontend/src/features/components/ConfigurationPanel.module.scss`
- `frontend/src/features/components/CustomNode.module.scss`
- `frontend/src/features/components/FileList.module.scss`
- `frontend/src/features/components/FileListItem.module.scss`
- `frontend/src/features/components/ResultPanel.module.scss`
- `frontend/src/features/components/Sidebar.module.scss`
- `frontend/src/features/components/StatusBadge.module.scss`
- `frontend/src/features/components/UploadButton.module.scss`
- `frontend/src/features/components/form/FormCheckboxGroup.module.scss`
- `frontend/src/features/components/form/FormExclusiveChoice.module.scss`
- `frontend/src/features/components/form/FormFile.module.scss`
- `frontend/src/features/components/form/FormSwitch.module.scss`
- `frontend/src/features/layout/Header.module.scss`
- `frontend/src/features/layout/IconSidebar.module.scss`
- `frontend/src/pages/DatasetDetail.module.scss`
- `frontend/src/pages/DatasetListPage.module.scss`
- `frontend/src/pages/auth/LoginPage.module.scss`
- `frontend/src/pages/auth/RegisterPage.module.scss`

## Components importing CSS Modules
- `frontend/src/App.tsx`
- `frontend/src/features/components/ConfigurationPanel.tsx`
- `frontend/src/features/components/CreateMappingModal.tsx`
- `frontend/src/features/components/CustomNode.tsx`
- `frontend/src/features/components/DataPreviewModal.tsx`
- `frontend/src/features/components/FileList.tsx`
- `frontend/src/features/components/FileListItem.tsx`
- `frontend/src/features/components/ResultPanel.tsx`
- `frontend/src/features/components/Sidebar.tsx`
- `frontend/src/features/components/StatusBadge.tsx`
- `frontend/src/features/components/UploadButton.tsx`
- `frontend/src/features/components/form/FormCheckboxGroup.tsx`
- `frontend/src/features/components/form/FormExclusiveChoice.tsx`
- `frontend/src/features/components/form/FormFile.tsx`
- `frontend/src/features/components/form/FormSwitch.tsx`
- `frontend/src/features/layout/Header.tsx`
- `frontend/src/features/layout/IconSidebar.tsx`
- `frontend/src/pages/DatasetDetail.tsx`
- `frontend/src/pages/DatasetListPage.tsx`
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/pages/auth/RegisterPage.tsx`

## Global SCSS marked as moved

## Tokens (final)
- Variables (50): $bg-main, $bg-panel, $text-primary, $text-secondary, $border-color, $shadow-color, $accent-color, $accent-color-edge, $accent-glow, $danger-color, $success-color, $text-on-glass, $text-on-glass-sub, $node-input-c1, $node-input-c2, $node-input-accent, $node-output-c1, $node-output-c2, $node-output-accent, $node-tokenizer-c1, $node-tokenizer-c2, $node-tokenizer-accent, $node-tokenfilter-c1, $node-tokenfilter-c2, $node-tokenfilter-accent, $node-charfilter-c1, $node-charfilter-c2, $node-charfilter-accent, $gradient-input, $gradient-output, $gradient-tokenizer, $gradient-token-filter, $gradient-char-filter, $gradient-button-primary, $font-family-sans, $font-weight-medium, $font-weight-bold, $border-radius-xl, $border-radius-lg, $border-radius-md, $border-radius-sm, $border-radius-node, $border-radius-pill, $spacing-unit, $box-shadow-soft, $backdrop-blur, $glass-blur-strength, $glass-border-color, $glass-inner-highlight, $glass-inner-shadow
- Mixins (3): @mixin glass-panel, @mixin soft-shadow, @mixin interactive-shadow

## Technical debt (remaining)
- Review `styles/index.scss` imports and remove legacy bundles once all consumers are migrated.
- Normalize shared button styles into a shared module if reused across components.
- Re-run style audit to identify unused classes and orphans.