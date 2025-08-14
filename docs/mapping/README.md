# 🔧 **Guide du Mapping DSL - Elasticsearch Analyzer App**

## 📖 **Vue d'ensemble**

Ce guide couvre l'utilisation complète du Mapping DSL V2, des fonctionnalités de base (V2.1) aux opérations avancées (V2.2) pour la transformation et la validation des données Elasticsearch.

## 🎯 **Versions Disponibles**

- **V2.1** : Fonctionnalités de base (containers, JSONPath, opérations simples)
- **V2.2** : Extensions avancées (opérations array, options de champ ES)

## 🚀 **Fonctionnalités V2.1 (Base)**

### **1. Containers (Conteneurs)**

Les containers permettent de définir explicitement la structure des données imbriquées :

```json
{
  "containers": [
    {
      "path": "contacts[]",
      "type": "nested"
    },
    {
      "path": "address",
      "type": "object"
    }
  ]
}
```

**Types de containers :**
- **`object`** : Structure simple de type objet
- **`nested`** : Structure imbriquée pour les tableaux d'objets

**Syntaxe des chemins :**
- `"contacts[]"` : Tableau de contacts (nested)
- `"address"` : Objet simple (object)
- `"user.profile"` : Chemin imbriqué

### **2. Inputs JSONPath**

Nouveau type d'input pour extraire des données complexes :

```json
{
  "input": [
    {
      "kind": "jsonpath",
      "expr": "$.contacts[*].phone"
    }
  ]
}
```

**Expressions JSONPath supportées :**
- `$.field` : Champ simple
- `$.array[*]` : Tous les éléments d'un tableau
- `$.array[0]` : Premier élément
- `$.nested.field` : Champ imbriqué

### **3. Opérations de Base**

#### **`zip` - Combinaison de tableaux**
```json
{
  "op": "zip",
  "arrays": ["names", "ages", "emails"],
  "pad": true
}
```

#### **`objectify` - Création d'objets**
```json
{
  "op": "objectify",
  "keys": ["name", "age", "email"],
  "values": ["John", 30, "john@example.com"]
}
```

## ⚡ **Fonctionnalités V2.2 (Avancées)**

### **1. Opérations Array Avancées**

#### **`filter` - Filtrage d'éléments**
```json
{
  "op": "filter",
  "condition": {
    "field": "age",
    "operator": ">",
    "value": 18
  }
}
```

#### **`slice` - Sélection de plage**
```json
{
  "op": "slice",
  "start": 0,
  "end": 10,
  "step": 2
}
```

#### **`unique` - Élimination des doublons**
```json
{
  "op": "unique",
  "key": "email"
}
```

#### **`sort` - Tri des éléments**
```json
{
  "op": "sort",
  "key": "age",
  "order": "desc"
}
```

### **2. Options de Champ Elasticsearch**

#### **Configuration des Mappings**
```json
{
  "mapping_options": {
    "index": false,
    "store": true,
    "doc_values": false,
    "null_value": "N/A"
  }
}
```

#### **Analyseurs Personnalisés**
```json
{
  "analyzer": {
    "type": "custom",
    "tokenizer": "standard",
    "filter": ["lowercase", "stop"]
  }
}
```

## 🔄 **Pipelines et Combinaisons**

### **Pipeline Simple**
```json
{
  "pipeline": [
    {
      "op": "trim"
    },
    {
      "op": "lower"
    },
    {
      "op": "replace",
      "pattern": "\\s+",
      "replacement": "_"
    }
  ]
}
```

### **Pipeline avec Conditions**
```json
{
  "pipeline": [
    {
      "op": "if",
      "condition": {
        "field": "type",
        "operator": "==",
        "value": "email"
      },
      "then": [
        {
          "op": "validate_email"
        }
      ],
      "else": [
        {
          "op": "trim"
        }
      ]
    }
  ]
}
```

### **Pipeline Imbriqué**
```json
{
  "pipeline": [
    {
      "op": "map",
      "then": [
        {
          "op": "if",
          "condition": {"field": "active", "operator": "==", "value": true},
          "then": [
            {"op": "uppercase"}
          ],
          "else": [
            {"op": "lowercase"}
          ]
        }
      ]
    }
  ]
}
```

## 📊 **Exemples d'Usage**

### **Gestion des Contacts**
```json
{
  "name": "Contact Processing",
  "containers": [
    {
      "path": "contacts[]",
      "type": "nested"
    }
  ],
  "pipeline": [
    {
      "op": "map",
      "then": [
        {
          "op": "trim",
          "fields": ["name", "email"]
        },
        {
          "op": "validate_email",
          "field": "email"
        },
        {
          "op": "if",
          "condition": {
            "field": "phone",
            "operator": "exists"
          },
          "then": [
            {
              "op": "format_phone",
              "format": "international"
            }
          ]
        }
      ]
    },
    {
      "op": "filter",
      "condition": {
        "field": "email",
        "operator": "valid"
      }
    }
  ]
}
```

### **Traitement des Logs**
```json
{
  "name": "Log Processing",
  "pipeline": [
    {
      "op": "parse_timestamp",
      "field": "timestamp",
      "format": "ISO8601"
    },
    {
      "op": "extract_level",
      "field": "message",
      "patterns": ["ERROR", "WARN", "INFO", "DEBUG"]
    },
    {
      "op": "if",
      "condition": {
        "field": "level",
        "operator": "in",
        "value": ["ERROR", "WARN"]
      },
      "then": [
        {
          "op": "add_field",
          "name": "priority",
          "value": "high"
        }
      ]
    }
  ]
}
```

## 🧪 **Validation et Tests**

### **Endpoint de Validation**
```bash
POST /mappings/validate
Content-Type: application/json

{
  "mapping": { ... },
  "data": { ... }
}
```

### **Endpoint de Compilation**
```bash
POST /mappings/compile
Content-Type: application/json

{
  "mapping": { ... }
}
```

### **Endpoint de Test (Dry-run)**
```bash
POST /mappings/dry-run
Content-Type: application/json

{
  "mapping": { ... },
  "data": { ... }
}
```

## 📈 **Performance et Optimisations**

### **Cache JSONPath**
- **Hit Rate** : Objectif > 80%
- **Taille** : Limite à 500 expressions
- **TTL** : 1 heure par défaut

### **Optimisations Recommandées**
1. **Réutiliser les expressions JSONPath** fréquentes
2. **Limiter la profondeur** des pipelines imbriqués
3. **Utiliser les opérations natives** quand possible
4. **Éviter les opérations coûteuses** sur de gros volumes

### **Métriques de Performance**
```promql
# Latence des opérations
histogram_quantile(0.95, mapping_op_ms_count)

# Taux de succès
rate(mapping_apply_success_total[5m]) / (rate(mapping_apply_success_total[5m]) + rate(mapping_apply_fail_total[5m]))

# Utilisation du cache
rate(jsonpath_cache_hits_total[5m]) / (rate(jsonpath_cache_hits_total[5m]) + rate(jsonpath_cache_misses_total[5m]))
```

## 🔒 **Sécurité et Validation**

### **Limites de Sécurité**
- **Taille maximale** : 1MB par mapping
- **Profondeur maximale** : 10 niveaux d'imbrication
- **Nombre d'opérations** : 100 par pipeline
- **Timeout** : 30 secondes par exécution

### **Validation des Données**
- **Schéma JSON** : Validation stricte des structures
- **Types de données** : Vérification des types
- **Expressions JSONPath** : Validation de la syntaxe
- **Opérations** : Vérification des paramètres

## 📚 **Références et Ressources**

### **Documentation API**
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

### **Schémas de Validation**
- **Mapping Schema V2** : `app/domain/mapping/validators/common/mapping.schema.json`
- **Tests** : `tests/domain/mapping/test_dsl_v21.py`

### **Exemples Complets**
- **Cas d'usage** : `docs/mapping/examples.md`
- **Migration** : `docs/mapping/migration.md`
- **Opérations** : `docs/mapping/operations.md`

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready
