# 🔄 **Guide de Migration V1 → V2 - Elasticsearch Mapping DSL**

## 📋 **Vue d'ensemble de la migration**

La migration de la V1 vers la V2 est **automatique et rétrocompatible**. Tous vos mappings V1 existants continueront de fonctionner sans modification.

## ✅ **Compatibilité garantie**

### **Ce qui fonctionne immédiatement :**
- ✅ Tous les mappings V1 existants
- ✅ Toutes les opérations V1
- ✅ Tous les types d'inputs V1
- ✅ Tous les pipelines V1
- ✅ Tous les multi-fields V1

### **Ce qui est amélioré automatiquement :**
- 🔄 Validation avec le nouveau schéma V2
- 🔄 Compilation avec les nouvelles règles
- 🔄 Exécution avec l'optimiseur V2

## 🚀 **Migration progressive recommandée**

### **Étape 1 : Mise à jour de la version**

```json
// Avant (V1)
{
  "dsl_version": "1.0",
  // ... reste du mapping
}

// Après (V2)
{
  "dsl_version": "2.0",
  // ... reste du mapping identique
}
```

### **Étape 2 : Ajout des containers explicites**

```json
// V1 (implicite)
{
  "fields": [
    {
      "target": "user.profile.name",
      "type": "keyword"
    }
  ]
}

// V2 (explicite)
{
  "containers": [
    {
      "path": "user",
      "type": "object"
    },
    {
      "path": "user.profile",
      "type": "object"
    }
  ],
  "fields": [
    {
      "target": "user.profile.name",
      "type": "keyword"
    }
  ]
}
```

### **Étape 3 : Migration des inputs complexes**

```json
// V1 : Colonnes multiples
{
  "input": [
    {"kind": "column", "name": "first_name"},
    {"kind": "column", "name": "last_name"}
  ]
}

// V2 : JSONPath pour données imbriquées
{
  "input": [
    {"kind": "jsonpath", "expr": "$.user.name"}
  ]
}
```

## 🔍 **Analyse de compatibilité**

### **Script de vérification automatique**

```python
#!/usr/bin/env python3
"""Script de vérification de compatibilité V1→V2"""

import json
import requests

def check_v1_compatibility(mapping_v1):
    """Vérifie la compatibilité d'un mapping V1 avec la V2."""
    
    # Copie du mapping
    mapping_v2 = mapping_v1.copy()
    mapping_v2["dsl_version"] = "2.0"
    
    # Test de validation V2
    response = requests.post(
        "http://localhost:8000/mappings/validate",
        json=mapping_v2
    )
    
    if response.status_code == 200:
        result = response.json()
        return result.get("valid", False)
    
    return False

def analyze_migration_needs(mapping_v1):
    """Analyse les besoins de migration."""
    
    needs = {
        "containers": [],
        "jsonpath_inputs": [],
        "array_operations": []
    }
    
    # Détecter les champs imbriqués
    for field in mapping_v1.get("fields", []):
        target = field.get("target", "")
        if "." in target:
            parts = target.split(".")
            if len(parts) > 1:
                needs["containers"].append({
                    "path": ".".join(parts[:-1]),
                    "type": "object"
                })
    
    return needs
```

## 📊 **Exemples de migration complets**

### **Exemple 1 : Mapping utilisateur simple**

#### **V1 Original :**
```json
{
  "dsl_version": "1.0",
  "index": "users",
  "fields": [
    {
      "target": "name",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "name"}
      ],
      "pipeline": [
        {"op": "trim"}
      ]
    },
    {
      "target": "age",
      "type": "long",
      "input": [
        {"kind": "column", "name": "age"}
      ],
      "pipeline": [
        {"op": "cast", "to": "long"}
      ]
    }
  ]
}
```

#### **V2 Migré :**
```json
{
  "dsl_version": "2.0",
  "index": "users",
  "fields": [
    {
      "target": "name",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "name"}
      ],
      "pipeline": [
        {"op": "trim"}
      ]
    },
    {
      "target": "age",
      "type": "long",
      "input": [
        {"kind": "column", "name": "age"}
      ],
      "pipeline": [
        {"op": "cast", "to": "long"}
      ]
    }
  ]
}
```

**Changements :** Aucun (compatibilité totale)

### **Exemple 2 : Mapping avec données imbriquées**

#### **V1 Original :**
```json
{
  "dsl_version": "1.0",
  "index": "users",
  "fields": [
    {
      "target": "contact.phone",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "phone"}
      ],
      "pipeline": [
        {"op": "trim"}
      ]
    },
    {
      "target": "contact.email",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "email"}
      ],
      "pipeline": [
        {"op": "lowercase"}
      ]
    }
  ]
}
```

#### **V2 Migré :**
```json
{
  "dsl_version": "2.0",
  "index": "users",
  "containers": [
    {
      "path": "contact",
      "type": "object"
    }
  ],
  "fields": [
    {
      "target": "contact.phone",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "phone"}
      ],
      "pipeline": [
        {"op": "trim"}
      ]
    },
    {
      "target": "contact.email",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "email"}
      ],
      "pipeline": [
        {"op": "lowercase"}
      ]
    }
  ]
}
```

**Changements :** Ajout de la déclaration explicite du container `contact`

### **Exemple 3 : Mapping avec tableaux**

#### **V1 Original :**
```json
{
  "dsl_version": "1.0",
  "index": "users",
  "fields": [
    {
      "target": "tags",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "tags"}
      ],
      "pipeline": [
        {"op": "split", "sep": ","},
        {"op": "trim"}
      ]
    }
  ]
}
```

#### **V2 Migré avec nouvelles fonctionnalités :**
```json
{
  "dsl_version": "2.0",
  "index": "users",
  "containers": [
    {
      "path": "tags[]",
      "type": "nested"
    }
  ],
  "fields": [
    {
      "target": "tags.value",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.tags[*]"}
      ],
      "pipeline": [
        {"op": "map", "then": [{"op": "trim"}]}
      ]
    },
    {
      "target": "tags_count",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.tags[*]"}
      ],
      "pipeline": [
        {"op": "length"}
      ]
    }
  ]
}
```

**Changements :**
- Ajout du container `tags[]` de type `nested`
- Utilisation de JSONPath pour extraire les éléments
- Nouvelle opération `map` pour traiter chaque tag
- Nouveau champ `tags_count` avec l'opération `length`

## ⚠️ **Points d'attention lors de la migration**

### **1. Gestion des erreurs**

```json
// V1 : Gestion d'erreur basique
{
  "op": "cast",
  "to": "long"
}

// V2 : Gestion d'erreur robuste
{
  "op": "when",
  "cond": {"is_numeric": true},
  "then": [
    {"op": "cast", "to": "long"}
  ],
  "else": [
    {"op": "literal", "value": 0}
  ]
}
```

### **2. Performance des pipelines**

```json
// V1 : Pipeline séquentiel
[
  {"op": "trim"},
  {"op": "lowercase"},
  {"op": "replace", "pattern": "\\s+", "replacement": "_"}
]

// V2 : Pipeline optimisé avec map
{
  "op": "map",
  "then": [
    {"op": "trim"},
    {"op": "lowercase"},
    {"op": "replace", "pattern": "\\s+", "replacement": "_"}
  ]
}
```

### **3. Validation des données**

```json
// V1 : Validation simple
{
  "op": "cast",
  "to": "date"
}

// V2 : Validation avec fallback
{
  "op": "when",
  "cond": {"is_date": true},
  "then": [
    {"op": "cast", "to": "date"}
  ],
  "else": [
    {"op": "literal", "value": "1970-01-01"}
  ]
}
```

## 🔧 **Outils de migration**

### **Script de migration automatique**

```python
def migrate_v1_to_v2(mapping_v1):
    """Migre automatiquement un mapping V1 vers V2."""
    
    mapping_v2 = mapping_v1.copy()
    mapping_v2["dsl_version"] = "2.0"
    
    # Détecter et ajouter les containers
    containers = detect_containers(mapping_v1)
    if containers:
        mapping_v2["containers"] = containers
    
    # Optimiser les pipelines
    mapping_v2["fields"] = optimize_pipelines(mapping_v1["fields"])
    
    return mapping_v2

def detect_containers(mapping):
    """Détecte automatiquement les containers nécessaires."""
    
    containers = []
    paths = set()
    
    for field in mapping.get("fields", []):
        target = field.get("target", "")
        if "." in target:
            parts = target.split(".")
            for i in range(1, len(parts)):
                path = ".".join(parts[:i])
                if path not in paths:
                    paths.add(path)
                    containers.append({
                        "path": path,
                        "type": "object"
                    })
    
    return containers
```

## 📈 **Bénéfices de la migration**

### **Avant (V1) :**
- ❌ Containers implicites
- ❌ Pas de support JSONPath
- ❌ Opérations limitées sur les tableaux
- ❌ Pipelines séquentiels

### **Après (V2) :**
- ✅ Containers explicites et optimisés
- ✅ Support JSONPath complet
- ✅ Opérations array-aware puissantes
- ✅ Pipelines parallélisables

## 🎯 **Plan de migration recommandé**

### **Phase 1 : Préparation (1-2 jours)**
- [ ] Audit des mappings V1 existants
- [ ] Identification des besoins de migration
- [ ] Planification des tests

### **Phase 2 : Migration simple (3-5 jours)**
- [ ] Mise à jour des versions
- [ ] Ajout des containers explicites
- [ ] Tests de compatibilité

### **Phase 3 : Optimisation (5-10 jours)**
- [ ] Migration vers JSONPath
- [ ] Implémentation des opérations array-aware
- [ ] Tests de performance

### **Phase 4 : Validation (2-3 jours)**
- [ ] Tests complets
- [ ] Validation des métriques
- [ ] Documentation des changements

## 🔍 **Tests de régression**

### **Suite de tests automatique**

```bash
# Test de compatibilité V1
python -m pytest tests/regression/test_v1_compatibility.py

# Test des nouvelles fonctionnalités V2
python -m pytest tests/api/v1/test_mappings_v2.py

# Test de performance
python -m pytest tests/performance/test_v2_performance.py
```

### **Validation des données**

```bash
# Test avec données V1
curl -X POST /mappings/dry-run -d @v1_test_data.json

# Test avec données V2
curl -X POST /mappings/dry-run -d @v2_test_data.json

# Comparaison des résultats
python compare_results.py v1_output.json v2_output.json
```

---

**🎯 La migration V1→V2 est simple, sûre et apporte des améliorations significatives !**
