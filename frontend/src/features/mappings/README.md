# 🏗️ Mappings - Système de Mapping Elasticsearch

## 📋 **Vue d'Ensemble**

Ce dossier contient le système complet de mapping Elasticsearch avec tous ses composants intégrés dans `MappingWorkbenchV2`.

## 📚 **Documentation**

**⚠️ La documentation complète a été déplacée vers `docs/` :**

- **[Architecture Complète](../../../docs/frontend/mappings/architecture-overview.md)**
- **[Module Intelligence](../../../docs/frontend/mappings/intelligence-components.md)**
- **[Module Studio](../../../docs/frontend/mappings/studio-components.md)**
- **[Intégrations et Migrations](../../../docs/mapping/integrations-and-migrations.md)**

## 🏗️ **Structure Réelle**

```
mappings/
├── api/                     # API et services
├── components/              # Composants React principaux
│   ├── field_management/    # Gestion des champs (FieldsGrid, SortableItem)
│   ├── intelligence/        # Composants IA (TypeInference, OperationSuggestions, etc.)
│   ├── interface/           # Interface utilisateur (Toasts, Shortcuts)
│   ├── life_cycle/          # Cycle de vie des mappings (DryRun, Compile, Apply)
│   ├── metrics/             # Métriques et indicateurs
│   ├── studio/              # Composants Studio (PipelineDnD, OperationEditor, etc.)
│   ├── validation/          # Validation des mappings
│   └── __tests__/           # Tests des composants principaux
├── config/                  # Configuration (v2.2)
├── demo/                    # Démonstrations et exemples
├── hooks/                   # Hooks personnalisés
├── lib/                     # Utilitaires et bibliothèques
├── types/                   # Types TypeScript (v2.2)
├── index.ts                 # Exports principaux
└── README.md                # Ce fichier
```

## 🚀 **Statut**

✅ **100% Intégré** dans MappingWorkbenchV2  
✅ **Tests passants**  
✅ **Build de production** fonctionnel  
✅ **Architecture documentée** dans `docs/`

---

**💡 Pour plus d'informations, consultez la documentation dans `docs/` !**
