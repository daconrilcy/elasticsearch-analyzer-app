# 🚀 **Elasticsearch Mapping DSL V2 - Guide Utilisateur**

## 📖 **Vue d'ensemble**

La **V2** du système de mapping Elasticsearch introduit des fonctionnalités avancées pour gérer des données complexes et imbriquées :

- **🔗 Containers** : Déclaration explicite des types `object` et `nested`
- **🎯 JSONPath** : Extraction avancée de données avec expressions JSONPath
- **⚡ Opérations Array-aware** : Nouvelles opérations pour manipuler les tableaux
- **🔄 Pipelines avancés** : Sous-pipelines conditionnels et imbriqués

## 🆕 **Nouvelles fonctionnalités V2**

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

### **3. Opérations Array-aware**

#### **`map` - Application de pipeline sur chaque élément**

```json
{
  "op": "map",
  "then": [
    {
      "op": "trim"
    },
    {
      "op": "lower"
    }
  ]
}
```

#### **`take` - Sélection d'éléments**

```json
{
  "op": "take",
  "which": "first"  // "first", "last", ou index numérique
}
```

#### **`join` - Concaténation d'éléments**

```json
{
  "op": "join",
  "sep": "|"  // Séparateur personnalisé
}
```

#### **`flatten` - Aplatissement de tableaux imbriqués**

```json
{
  "op": "flatten"
}
```

## 📝 **Exemples complets**

### **Exemple 1 : Contacts avec téléphones nettoyés**

```json
{
  "dsl_version": "2.0",
  "index": "users_v2",
  "containers": [
    {
      "path": "contacts[]",
      "type": "nested"
    }
  ],
  "fields": [
    {
      "target": "contacts.phone",
      "type": "keyword",
      "input": [
        {
          "kind": "jsonpath",
          "expr": "$.contacts[*].phone"
        }
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "trim"
            },
            {
              "op": "regex_replace",
              "pattern": "\\+33",
              "replacement": "0"
            }
          ]
        }
      ]
    }
  ]
}
```

### **Exemple 2 : Tags avec statistiques**

```json
{
  "dsl_version": "2.0",
  "index": "users_v2",
  "fields": [
    {
      "target": "tags_first",
      "type": "keyword",
      "input": [
        {
          "kind": "jsonpath",
          "expr": "$.tags[*]"
        }
      ],
      "pipeline": [
        {
          "op": "take",
          "which": "first"
        }
      ]
    },
    {
      "target": "tags_joined",
      "type": "keyword",
      "input": [
        {
          "kind": "jsonpath",
          "expr": "$.tags[*]"
        }
      ],
      "pipeline": [
        {
          "op": "join",
          "sep": "|"
        }
      ]
    }
  ]
}
```

### **Exemple 3 : Pipeline conditionnel complexe**

```json
{
  "dsl_version": "2.0",
  "index": "scores_v2",
  "containers": [
    {
      "path": "scores[]",
      "type": "nested"
    }
  ],
  "fields": [
    {
      "target": "scores.value",
      "type": "long",
      "input": [
        {
          "kind": "jsonpath",
          "expr": "$.scores[*].value"
        }
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "when",
              "cond": {"gt": 50},
              "then": [
                {
                  "op": "cast",
                  "to": "long"
                }
              ],
              "else": [
                {
                  "op": "literal",
                  "value": 0
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 🔧 **Migration depuis V1**

### **Changements automatiques :**
- `dsl_version` : Mise à jour vers "2.0"
- Compatibilité totale avec les mappings V1 existants

### **Ajouts recommandés :**
- Déclaration explicite des containers pour les champs imbriqués
- Utilisation de JSONPath pour les données complexes
- Exploitation des nouvelles opérations array-aware

## 📊 **Structure des données générées**

### **Mapping V1 (implicite) :**
```json
{
  "properties": {
    "contacts": {
      "type": "object",
      "properties": {
        "phone": {"type": "keyword"}
      }
    }
  }
}
```

### **Mapping V2 (explicite) :**
```json
{
  "properties": {
    "contacts": {
      "type": "nested",
      "properties": {
        "phone": {"type": "keyword"}
      }
    }
  }
}
```

## 🚨 **Limitations et bonnes pratiques**

### **Limitations :**
- Profondeur maximale des containers : 10 niveaux
- Taille maximale des expressions JSONPath : 1000 caractères
- Nombre maximum d'opérations par pipeline : 50

### **Bonnes pratiques :**
- Déclarer explicitement tous les containers
- Utiliser des noms de champs descriptifs
- Tester les pipelines complexes avec des données réelles
- Valider la structure des données avant compilation

## 🔍 **Dépannage**

### **Erreurs courantes :**

1. **Container non trouvé** : Vérifier la déclaration dans `containers`
2. **Expression JSONPath invalide** : Tester avec des outils JSONPath
3. **Pipeline trop complexe** : Diviser en sous-pipelines
4. **Type de données incorrect** : Vérifier les opérations de cast

### **Outils de diagnostic :**
- Endpoint `/mappings/validate` : Validation du schéma
- Endpoint `/mappings/compile` : Vérification de la compilation
- Endpoint `/mappings/dry-run` : Test avec données réelles

## 📚 **Références**

- [Spécification JSON Schema V2](app/domain/mapping/validators/common/mapping.schema.json)
- [Guide des opérations](docs/operations_v2.md)
- [Exemples avancés](docs/examples_v2.md)
- [Migration V1→V2](docs/migration_v2.md)

---

**🎯 La V2 ouvre de nouvelles possibilités pour la gestion de données complexes dans Elasticsearch !**
