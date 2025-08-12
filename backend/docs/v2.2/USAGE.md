# Mapping DSL V2.2 - Guide d'Utilisation

## 🚀 **Démarrage Rapide V2.2**

### **Configuration de Base**
```json
{
  "dsl_version": "2.2",
  "index": "my_v22_index",
  "globals": {
    "nulls": [], "bool_true": [], "bool_false": [],
    "decimal_sep": ",", "thousands_sep": " ",
    "date_formats": [], "default_tz": "Europe/Paris",
    "empty_as_null": true, "preview": {}
  },
  "id_policy": {
    "from": ["id"], "op": "concat", "sep": ":", "on_conflict": "error"
  }
}
```

## 📊 **Opérations Array V2.2**

### **1. Filtrage Avancé**

#### **Filtrage Simple**
```json
{
  "target": "active_users",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.users[*]"}],
  "pipeline": [
    {"op": "filter", "cond": {"gt": 0}},
    {"op": "join", "sep": ","}
  ]
}
```

#### **Filtrage sur Propriété d'Objet**
```json
{
  "target": "premium_products",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.products[*]"}],
  "pipeline": [
    {"op": "filter", "cond": {"gt": 100, "by": "price"}},
    {"op": "map", "then": [{"op": "dict", "key": "name"}]},
    {"op": "join", "sep": " | "}
  ]
}
```

### **2. Extraction et Découpage**

#### **Top N Éléments**
```json
{
  "target": "top_5",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.scores[*]"}],
  "pipeline": [
    {"op": "sort", "numeric": true, "order": "desc"},
    {"op": "slice", "start": 0, "end": 5},
    {"op": "join", "sep": ";"}
  ]
}
```

#### **Pagination**
```json
{
  "target": "page_2",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.items[*]"}],
  "pipeline": [
    {"op": "slice", "start": 10, "end": 20},
    {"op": "join", "sep": ","}
  ]
}
```

### **3. Déduplication et Tri**

#### **Déduplication Simple**
```json
{
  "target": "unique_tags",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.tags[*]"}],
  "pipeline": [
    {"op": "unique"},
    {"op": "sort", "order": "asc"},
    {"op": "join", "sep": ","}
  ]
}
```

#### **Tri Complexe sur Objets**
```json
{
  "target": "sorted_employees",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.employees[*]"}],
  "pipeline": [
    {"op": "sort", "by": "salary", "numeric": true, "order": "desc"},
    {"op": "map", "then": [{"op": "dict", "key": "name"}]},
    {"op": "join", "sep": " > "}
  ]
}
```

## 🔧 **Options de Champ Elasticsearch**

### **1. Configuration `copy_to`**

#### **Champ de Recherche Multiple**
```json
{
  "target": "product_name",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.name"}],
  "pipeline": [],
  "copy_to": ["search_all", "product_search", "brand_search"]
}
```

#### **Champ d'Analyse**
```json
{
  "target": "search_all",
  "type": "text",
  "analyzer": "standard",
  "input": [{"kind": "literal", "value": ""}],
  "pipeline": []
}
```

### **2. Limitation de Longueur**

#### **Titre Optimisé**
```json
{
  "target": "title",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.title"}],
  "pipeline": [{"op": "trim"}],
  "ignore_above": 256
}
```

#### **Description avec Limite**
```json
{
  "target": "short_desc",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.description"}],
  "pipeline": [
    {"op": "trim"},
    {"op": "slice", "start": 0, "end": 100}
  ],
  "ignore_above": 100
}
```

### **3. Valeurs par Défaut**

#### **Statut avec Valeur par Défaut**
```json
{
  "target": "status",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.status"}],
  "pipeline": [],
  "null_value": "(unknown)"
}
```

#### **Prix avec Valeur par Défaut**
```json
{
  "target": "price",
  "type": "double",
  "input": [{"kind": "jsonpath", "expr": "$.price"}],
  "pipeline": [{"op": "cast", "to": "number"}],
  "null_value": 0.0
}
```

## 🎨 **Propriétés Root Elasticsearch**

### **1. Templates Dynamiques**

#### **Configuration Automatique des Chaînes**
```json
{
  "dynamic_templates": [
    {
      "string_fields": {
        "match_mapping_type": "string",
        "match": "*",
        "unmatch": "*.raw",
        "mapping": {
          "type": "keyword",
          "ignore_above": 256,
          "copy_to": "{name}.raw"
        }
      }
    },
    {
      "text_fields": {
        "match": "*.text",
        "mapping": {
          "type": "text",
          "analyzer": "standard"
        }
      }
    }
  ]
}
```

### **2. Champs Runtime**

#### **Calcul d'Année**
```json
{
  "runtime_fields": {
    "year": {
      "type": "long",
      "script": {
        "source": "emit(doc['created_at'].value.getYear())"
      }
    },
    "age": {
      "type": "long",
      "script": {
        "source": "emit(Instant.now().getEpochSecond() - doc['birth_date'].value.getEpochSecond())"
      }
    }
  }
}
```

## 🔄 **Pipelines Complexes V2.2**

### **Pipeline de Traitement Complet**
```json
{
  "target": "processed_data",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.data[*]"}],
  "pipeline": [
    {"op": "filter", "cond": {"gt": 0, "by": "value"}},
    {"op": "unique", "by": "id"},
    {"op": "sort", "by": "priority", "numeric": true, "order": "desc"},
    {"op": "slice", "start": 0, "end": 10},
    {"op": "map", "then": [
      {"op": "dict", "key": "name"},
      {"op": "concat", "sep": " - "}
    ]},
    {"op": "join", "sep": " | "}
  ]
}
```

### **Pipeline de Validation et Transformation**
```json
{
  "target": "valid_emails",
  "type": "keyword",
  "input": [{"kind": "jsonpath", "expr": "$.contacts[*].email"}],
  "pipeline": [
    {"op": "filter", "cond": {"matches": "^[^@]+@[^@]+\\.[^@]+$"}},
    {"op": "unique"},
    {"op": "lower"},
    {"op": "trim"},
    {"op": "join", "sep": ","}
  ]
}
```

## ⚠️ **Bonnes Pratiques V2.2**

### **1. Performance**
- **Limitez les opérations** : Maximum 50 ops par pipeline
- **Utilisez `slice`** : Pour limiter la taille des données traitées
- **Optimisez `filter`** : Placez les filtres en premier

### **2. Validation**
- **Vérifiez les types** : `ignore_above` uniquement sur `keyword`
- **Évitez les self-copies** : Pas de `copy_to` vers soi-même
- **Gérez les valeurs null** : Utilisez `null_value` approprié

### **3. Maintenance**
- **Documentez les pipelines** : Commentaires sur les opérations complexes
- **Testez les cas limites** : Valeurs null, tableaux vides
- **Versionnez les mappings** : Utilisez `dsl_version: "2.2"`

## 🧪 **Tests et Validation**

### **Test de Pipeline V2.2**
```bash
# Test des nouvelles opérations
curl -X POST "http://localhost:8000/api/v1/mappings/dry-run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [{"data": [1,2,3,4,5]}],
    "dsl_version": "2.2",
    "fields": [{
      "target": "result",
      "type": "keyword",
      "input": [{"kind": "jsonpath", "expr": "$.data[*]"}],
      "pipeline": [
        {"op": "filter", "cond": {"gt": 2}},
        {"op": "join", "sep": ","}
      ]
    }]
  }'
```

### **Validation des Options de Champ**
```bash
# Test des nouvelles options
curl -X POST "http://localhost:8000/api/v1/mappings/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dsl_version": "2.2",
    "fields": [{
      "target": "test",
      "type": "text",
      "ignore_above": 256
    }]
  }'
```

## 📚 **Ressources Supplémentaires**

- **Guide V2.1** : `../v2.1/IMPLEMENTATION.md`
- **Tests V2.2** : `../../tests/api/v1/test_mappings_v22.py`
- **Schéma JSON** : `../../app/domain/mapping/validators/common/mapping.schema.json`

---

*Guide d'Utilisation V2.2 - Mapping DSL - Version 2.2.0*
