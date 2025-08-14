# 🔧 **Guide du Mapping DSL - Elasticsearch Analyzer App**

## 📋 **Table des Matières**
- [📖 Vue d'ensemble](#-vue-densemble)
- [🎯 Versions Disponibles](#-versions-disponibles)
- [🚀 Fonctionnalités V2.1 (Base)](#-fonctionnalités-v21-base)
- [⚡ Fonctionnalités V2.2 (Avancées)](#-fonctionnalités-v22-avancées)
- [🔍 Exemples d'Usage](#-exemples-dusage)
- [📊 Validation et Compilation](#-validation-et-compilation)
- [🚨 Gestion des Erreurs](#-gestion-des-erreurs)
- [📈 Performance et Optimisation](#-performance-et-optimisation)
- [🔗 API et Intégration](#-api-et-intégration)
- [📚 Ressources](#-ressources)

---

## 📖 **Vue d'ensemble**

Ce guide couvre l'utilisation complète du Mapping DSL V2, des fonctionnalités de base (V2.1) aux opérations avancées (V2.2) pour la transformation et la validation des données Elasticsearch.

### **🎯 Objectifs du DSL**
- **Transformation de données** : Conversion et enrichissement des données
- **Validation** : Vérification de la cohérence et de la qualité
- **Flexibilité** : Support de structures complexes et imbriquées
- **Performance** : Optimisation des opérations de mapping

### **🔧 Cas d'Usage Principaux**
- **ETL** : Extraction, Transformation, Loading de données
- **Normalisation** : Standardisation des formats de données
- **Enrichissement** : Ajout d'informations calculées
- **Validation** : Contrôle de la qualité des données

---

## 🎯 **Versions Disponibles**

| Version | Fonctionnalités | Statut | Complexité |
|---------|----------------|---------|------------|
| **V2.1** | Containers, JSONPath, opérations simples | ✅ Stable | 👶 Débutant |
| **V2.2** | Opérations array, options de champ ES | ✅ Stable | 👨‍💻 Développeur |

### **🔄 Migration entre Versions**
- **V2.1 → V2.2** : Compatible, ajout de fonctionnalités
- **V1 → V2** : Guide de migration disponible
- **Rétrocompatibilité** : Maintien des fonctionnalités existantes

---

## 🚀 **Fonctionnalités V2.1 (Base)**

### **1. 🗂️ Containers (Conteneurs)**

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

#### **📋 Types de Containers**
| Type | Description | Usage |
|------|-------------|-------|
| **`object`** | Structure simple de type objet | Données plates |
| **`nested`** | Structure imbriquée pour les tableaux d'objets | Données hiérarchiques |

#### **🔗 Syntaxe des Chemins**
- `"contacts[]"` : Tableau de contacts (nested)
- `"address"` : Objet simple (object)
- `"user.profile"` : Chemin imbriqué
- `"orders[].items[]"` : Tableaux imbriqués

### **2. 🔍 Inputs JSONPath**

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

#### **📊 Expressions JSONPath Supportées**
| Expression | Description | Exemple |
|------------|-------------|---------|
| `$.field` | Champ simple | `$.name` |
| `$.array[*]` | Tous les éléments d'un tableau | `$.contacts[*]` |
| `$.array[0]` | Premier élément | `$.contacts[0]` |
| `$.nested.field` | Champ imbriqué | `$.user.profile.email` |
| `$.array[?(@.field == "value")]` | Filtrage conditionnel | `$.users[?(@.active == true)]` |

### **3. ⚙️ Opérations de Base**

#### **`zip` - Combinaison de Tableaux**
```json
{
  "op": "zip",
  "arrays": ["names", "ages", "emails"],
  "pad": true
}
```

**Paramètres :**
- **`arrays`** : Liste des noms de tableaux à combiner
- **`pad`** : Remplir avec `null` si les tableaux ont des longueurs différentes

#### **`objectify` - Création d'Objets**
```json
{
  "op": "objectify",
  "keys": ["name", "age", "email"],
  "values": ["John", 30, "john@example.com"]
}
```

**Paramètres :**
- **`keys`** : Noms des propriétés de l'objet
- **`values`** : Valeurs correspondantes

---

## ⚡ **Fonctionnalités V2.2 (Avancées)**

### **1. 🔄 Opérations Array Avancées**

#### **`filter` - Filtrage d'Éléments**
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

**Opérateurs Supportés :**
| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| **`==`** | Égalité stricte | `age == 25` |
| **`!=`** | Différence | `status != "inactive"` |
| **`>`** | Supérieur à | `age > 18` |
| **`>=`** | Supérieur ou égal | `score >= 80` |
| **`<`** | Inférieur à | `price < 100` |
| **`<=`** | Inférieur ou égal | `quantity <= 10` |
| **`in`** | Appartient à une liste | `category in ["A", "B"]` |
| **`not_in`** | N'appartient pas à une liste | `status not_in ["deleted"]` |

#### **`slice` - Sélection de Plage**
```json
{
  "op": "slice",
  "start": 0,
  "end": 10,
  "step": 2
}
```

**Paramètres :**
- **`start`** : Index de début (inclus)
- **`end`** : Index de fin (exclus)
- **`step`** : Pas d'incrémentation (optionnel)

#### **`unique` - Élimination des Doublons**
```json
{
  "op": "unique",
  "key": "id"
}
```

**Paramètres :**
- **`key`** : Champ utilisé pour identifier les doublons

#### **`sort` - Tri des Éléments**
```json
{
  "op": "sort",
  "key": "age",
  "order": "desc"
}
```

**Paramètres :**
- **`key`** : Champ de tri
- **`order`** : `"asc"` ou `"desc"`

### **2. 🎯 Options de Champ Elasticsearch**

#### **Configuration des Champs**
```json
{
  "op": "set_field_options",
  "field": "email",
  "options": {
    "type": "keyword",
    "analyzer": "standard",
    "ignore_above": 256
  }
}
```

**Options Disponibles :**
| Option | Description | Valeurs |
|--------|-------------|---------|
| **`type`** | Type de champ ES | `text`, `keyword`, `long`, `date` |
| **`analyzer`** | Analyseur de texte | `standard`, `whitespace`, `simple` |
| **`ignore_above`** | Taille maximale | Nombre de caractères |
| **`null_value`** | Valeur par défaut | Valeur à utiliser si null |

---

## 🔍 **Exemples d'Usage**

### **📊 Exemple 1 : Normalisation de Contacts**
```json
{
  "name": "Normalisation Contacts",
  "version": "2.2",
  "containers": [
    {
      "path": "contacts[]",
      "type": "nested"
    }
  ],
  "pipeline": [
    {
      "op": "filter",
      "condition": {
        "field": "active",
        "operator": "==",
        "value": true
      }
    },
    {
      "op": "set_field_options",
      "field": "email",
      "options": {
        "type": "keyword",
        "analyzer": "standard"
      }
    }
  ]
}
```

### **📈 Exemple 2 : Agrégation de Données**
```json
{
  "name": "Agrégation Ventes",
  "version": "2.2",
  "pipeline": [
    {
      "op": "filter",
      "condition": {
        "field": "amount",
        "operator": ">",
        "value": 0
      }
    },
    {
      "op": "group_by",
      "key": "category",
      "aggregations": {
        "total": "sum(amount)",
        "count": "count()",
        "average": "avg(amount)"
      }
    }
  ]
}
```

---

## 📊 **Validation et Compilation**

### **✅ Validation Syntaxique**
```bash
# Validation via API
curl -X POST "http://localhost:8000/api/v1/mappings/validate" \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

### **🔧 Compilation**
```bash
# Compilation du mapping
curl -X POST "http://localhost:8000/api/v1/mappings/compile" \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

### **🧪 Test Dry-Run**
```bash
# Test sans application
curl -X POST "http://localhost:8000/api/v1/mappings/dry-run" \
  -H "Content-Type: application/json" \
  -d @mapping.json
```

---

## 🚨 **Gestion des Erreurs**

### **❌ Erreurs Courantes**
| Erreur | Cause | Solution |
|--------|-------|----------|
| **Invalid JSON** | Syntaxe JSON incorrecte | Valider avec un linter JSON |
| **Unknown Operation** | Opération non reconnue | Vérifier la version du DSL |
| **Invalid Field Path** | Chemin de champ incorrect | Vérifier la structure des données |
| **Type Mismatch** | Type de données incompatible | Convertir ou valider les types |

### **🔍 Debug et Logs**
```json
{
  "debug": true,
  "log_level": "DEBUG",
  "pipeline": [
    {
      "op": "debug",
      "message": "Point de contrôle"
    }
  ]
}
```

---

## 📈 **Performance et Optimisation**

### **⚡ Bonnes Pratiques**
- **Filtrage précoce** : Appliquer les filtres en premier
- **Indexation** : Utiliser des index appropriés
- **Cache** : Mettre en cache les résultats fréquents
- **Pagination** : Traiter les données par lots

### **📊 Métriques de Performance**
```bash
# Métriques disponibles
curl http://localhost:8000/metrics | grep mapping
```

---

## 🔗 **API et Intégration**

### **📡 Endpoints Disponibles**
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| **`/mappings/validate`** | POST | Validation syntaxique |
| **`/mappings/compile`** | POST | Compilation du mapping |
| **`/mappings/apply`** | POST | Application aux données |
| **`/mappings/dry-run`** | POST | Test sans modification |

### **🔌 Intégration avec Elasticsearch**
```json
{
  "mapping": {
    "properties": {
      "processed_field": {
        "type": "keyword",
        "analyzer": "standard"
      }
    }
  }
}
```

---

## 📚 **Ressources**

### **🔗 Documentation Supplémentaire**
- **[Exemples Avancés](examples.md)** - Cas d'usage complexes
- **[Migration V1→V2](migration.md)** - Guide de transition
- **[Opérations Référence](operations.md)** - Documentation complète des opérations

### **🧪 Outils de Test**
- **Mapping Studio** : Interface visuelle pour créer des mappings
- **API Playground** : Tests interactifs des endpoints
- **Validateur en ligne** : Vérification syntaxique

### **📋 Templates Prêts à l'Emploi**
- **Contacts** : Normalisation et validation des contacts
- **Adresses** : Géocodage et formatage
- **Logs** : Analyse et enrichissement des logs

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready  
**DSL** : ✅ **Complet et Documenté**
