# Visual Regression Checklist

## Pages
- Auth: Login, Register
- Analyzer: Editor (flows, Sidebar, Header, IconSidebar, ConfigurationPanel, ResultPanel)
- Datasets: List, Detail (FileList, MappingList, UploadButton, CreateMappingModal)

## Viewports
- 360x640 (mobile)
- 768x1024 (tablet)
- 1440x900 (desktop)

## Quick fixes to watch
- Spacing regressions due to scope changes (margins within modules).
- z-index/panel stacking for overlays and panels.
- Font/color tokens applied consistently from variables.
- Specificity: consider using :where() wrappers to lower specificity where needed.