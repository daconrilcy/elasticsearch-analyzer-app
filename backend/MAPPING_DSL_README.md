# Validateur DSL des Mappings Elasticsearch

## Vue d'ensemble

Ce module implémente un validateur unifié pour le DSL (Domain Specific Language) de mapping qui permet de transformer des données CSV/JSON en index Elasticsearch. Il fournit trois endpoints principaux :

- **Validation** : Vérifie la syntaxe et la cohérence du mapping DSL
- **Compilation** : Génère le mapping Elasticsearch exploitable
- **Dry-run** : Exécute un test sur un échantillon de données

## Architecture

```
app/domain/mapping/
├── validators/
│   └── common/
│       ├── __init__.py
│       ├── mapping.schema.json    # Schéma JSON Schema Draft 2020-12
│       └── json_validator.py      # Validateur avec post-règles métier
├── schemas.py                     # Modèles Pydantic pour l'API
└── services.py                    # Service de validation et compilation

app/api/v1/
└── mappings.py                    # Endpoints FastAPI
```

## Endpoints API

### 1. Validation (`POST /api/v1/mappings/validate`)

Valide un mapping DSL et retourne les erreurs/warnings.

**Requête :**
```json
{
  "index": "demo",
  "globals": {
    "nulls": [],
    "bool_true": [],
    "bool_false": [],
    "decimal_sep": ",",
    "thousands_sep": " ",
    "date_formats": [],
    "default_tz": "Europe/Paris",
    "empty_as_null": true,
    "preview": {"sample_size": 10, "seed": 1}
  },
  "id_policy": {
    "from": ["id"],
    "op": "concat",
    "sep": ":",
    "on_conflict": "error"
  },
  "fields": [
    {
      "target": "name",
      "type": "text",
      "input": [{"kind": "column", "name": "full_name"}],
      "pipeline": [{"op": "trim"}]
    }
  ]
}
```

**Réponse :**
```json
{
  "errors": [],
  "warnings": [],
  "field_stats": [],
  "compiled": null
}
```

### 2. Compilation (`POST /api/v1/mappings/compile`)

Compile le mapping DSL en mapping Elasticsearch exploitable.

**Paramètres :**
- `includePlan` (query) : Inclure le plan d'exécution (optionnel)

**Réponse :**
```json
{
  "settings": {...},
  "mappings": {
    "properties": {
      "name": {"type": "text"},
      "age": {"type": "long"}
    }
  },
  "execution_plan": [
    {
      "target": "name",
      "input": [{"kind": "column", "name": "full_name"}],
      "ops": [{"op": "trim"}]
    }
  ]
}
```

### 3. Inférence de Types (`POST /api/v1/mappings/infer-types`)

Infère automatiquement les types Elasticsearch à partir d'un échantillon de données.

**Requête :**
```json
{
  "rows": [
    {"a": "12", "b": "2024-01-01", "c": "oui", "d": "Paris", "e": "1.2.3.4"}
  ],
  "globals": {
    "nulls": [],
    "bool_true": ["oui"],
    "bool_false": ["non"],
    "decimal_sep": ",",
    "thousands_sep": " ",
    "date_formats": ["yyyy-MM-dd"],
    "default_tz": "Europe/Paris",
    "empty_as_null": true
  }
}
```

**Réponse :**
```json
{
  "field_stats": [
    {
      "source": "a",
      "non_null": 1,
      "null_rate": 0.0,
      "unique": 1,
      "unique_ratio": 1.0,
      "avg_len": 2.0,
      "max_len": 2,
      "examples": ["12"],
      "candidates": {"double": 1.0, "integer": 0.9}
    }
  ],
  "suggestions": [
    {
      "source": "a",
      "es_type": "double",
      "confidence": 1.0,
      "reasons": ["1/1 numériques", "1/1 entiers"],
      "extras": {}
    }
  ]
}
```

### 4. Estimation de Taille (`POST /api/v1/mappings/estimate-size`)

Estime la taille de l'index et recommande le nombre de shards.

**Requête :**
```json
{
  "mapping": {
    "fields": [
      {"target": "name", "type": "text"},
      {"target": "status", "type": "keyword"},
      {"target": "price", "type": "double"}
    ]
  },
  "field_stats": [
    {"target": "name", "avg_len": 20},
    {"target": "status", "avg_len": 6}
  ],
  "num_docs": 1000000,
  "replicas": 1,
  "target_shard_size_gb": 30
}
```

**Réponse :**
```json
{
  "per_doc_bytes": 200,
  "primary_size_bytes": 200000000,
  "total_size_bytes": 400000000,
  "recommended_shards": 1,
  "target_shard_size_gb": 30,
  "breakdown": [
    {
      "target": "name",
      "type": "text",
      "per_doc_bytes": 30
    }
  ]
}
```

### 3. Dry-run (`POST /api/v1/mappings/dry-run`)

Exécute un test du mapping sur un échantillon de données.

**Réponse :**
```json
{
  "docs_preview": [],
  "issues": []
}
```

## Endpoints de Test

Pour faciliter les tests, des endpoints sans authentification sont disponibles :

- `POST /api/v1/mappings/validate/test`
- `POST /api/v1/mappings/compile/test`
- `POST /api/v1/mappings/dry-run/test`
- `POST /api/v1/mappings/infer-types/test`
- `POST /api/v1/mappings/estimate-size/test`

## 🎯 **Gains UX Immédiats**

### **Inférence → Mapping Builder**
- **Pré-remplissage automatique** des types ES
- **Proposition de multi-fields** : `*.raw` auto si `text`
- **Format de date** suggéré selon les données
- **Confidence score** pour chaque suggestion
- **Raisons détaillées** de chaque choix

### **Estimation de Taille**
- **Card de dimensionnement** dans l'écran "Validation"
- **Affichage** : ~ X Go primaires, ~ Y Go total
- **Recommandation** : Z shards suggérés
- **Breakdown** par champ pour optimisation
- **Ajustement** du nombre de réplicas

## Schéma DSL

Le mapping DSL suit cette structure :

### Champs obligatoires
- `index` : Nom de l'index Elasticsearch
- `globals` : Configuration globale (nulls, booléens, formats, etc.)
- `id_policy` : Politique de génération des IDs
- `fields` : Définition des champs et transformations

### Types de champs supportés
- `text`, `keyword`, `long`, `double`, `date`, `boolean`
- `geo_point`, `geo_shape`

### Opérations de pipeline
- `trim`, `lowercase`, `uppercase`
- `split`, `replace`
- `parse_date`, `parse_geo`, `parse_number`, `parse_boolean`

### Multi-fields
Support des sous-champs avec analyseurs/normaliseurs spécifiques.

## Validation

### Validation JSON Schema
- Vérification de la structure et des types
- Validation des patterns et contraintes
- Gestion des propriétés requises

### Post-règles métier
- **Unicité des targets** : Pas de doublons de chemins de champs
- **Références valides** : Analyseurs et normaliseurs doivent exister
- **Collisions multi-fields** : Vérification des noms de sous-champs
- **Politique d'ID** : Obligatoire pour éviter les conflits
- **Collision .raw** : Protection contre les conflits avec les champs réservés

## Compilation

La compilation transforme le DSL en mapping Elasticsearch :

1. **Types de base** : Conversion directe des types DSL vers types ES
2. **Multi-fields** : Génération de la structure `fields` ES
3. **Imbrication** : Support des chemins `a.b.c` via `properties` imbriqués
4. **Analyseurs/Normaliseurs** : Transmission directe des configurations
5. **Options** : Intégration des paramètres spécifiques aux types

## Tests

```bash
# Lancer tous les tests
python -m pytest tests/api/v1/test_mappings.py -v

# Lancer un test spécifique
python -m pytest tests/api/v1/test_mappings.py::test_validate_minimal -v

# Avec sortie détaillée
python -m pytest tests/api/v1/test_mappings.py -v -s
```

## Démonstration

Un script de démonstration est disponible :

```bash
python test_mapping_dsl.py
```

Ce script teste tous les endpoints avec un mapping DSL complet.

## Utilisation

### 1. Démarrer l'application
```bash
cd backend
uvicorn main:app --reload
```

### 2. Tester la validation
```bash
curl -X POST "http://localhost:8000/api/v1/mappings/validate/test" \
  -H "Content-Type: application/json" \
  -d @mapping_example.json
```

### 3. Compiler un mapping
```bash
curl -X POST "http://localhost:8000/api/v1/mappings/compile/test?includePlan=true" \
  -H "Content-Type: application/json" \
  -d @mapping_example.json
```

## Extensions futures

- **Exécution de pipeline** : Implémentation des opérations de transformation
- **Statistiques de champs** : Analyse des données pour optimiser les mappings
- **Validation avancée** : Règles métier supplémentaires
- **Génération de code** : Export vers d'autres formats (Python, Java, etc.)
- **Interface graphique** : Éditeur visuel du DSL

## Dépendances

- `jsonschema>=4.25.0` : Validation JSON Schema
- `fastapi` : Framework web
- `pydantic` : Validation des données
- `pytest` : Tests unitaires
