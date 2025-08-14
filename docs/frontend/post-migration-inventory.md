# Post Migration Inventory

## CSS Module files (added)

## Components importing CSS Modules

## Global SCSS marked as moved

## Tokens (final)
- Variables (0): 
- Mixins (0): 

## Technical debt (remaining)
- Review `styles/index.scss` imports and remove legacy bundles once all consumers are migrated.
- Normalize shared button styles into a shared module if reused across components.
- Re-run style audit to identify unused classes and orphans.