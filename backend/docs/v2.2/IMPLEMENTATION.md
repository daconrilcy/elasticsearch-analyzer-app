# Mapping DSL V2.2 - Guide d'Implémentation

## 🎯 **Vue d'Ensemble**

La version 2.2 du Mapping DSL apporte des fonctionnalités optionnelles avancées pour enrichir la manipulation des données et la configuration Elasticsearch, tout en maintenant une compatibilité totale avec V2.1.

## ✨ **Nouvelles Fonctionnalités V2.2**

### **1. Opérations Array Avancées**

#### **`filter` - Filtrage Conditionnel**
```json
{
  "op": "filter",
  "cond": {"gt": 3}
}
```
- **Description** : Filtre un tableau selon une condition
- **Paramètres** :
  - `cond` : Condition de filtrage (utilise le langage `when.cond`)
  - `by` : Clé d'objet pour filtrer sur une propriété spécifique
- **Exemple** : `[1,2,3,4,5]` avec `{"gt": 3}` → `[4,5]`

#### **`slice` - Extraction de Portions**
```json
{
  "op": "slice",
  "start": 0,
  "end": 2
}
```
- **Description** : Extrait une portion d'un tableau
- **Paramètres** :
  - `start` : Index de début (défaut: 0)
  - `end` : Index de fin (optionnel, défaut: jusqu'à la fin)
- **Exemple** : `[1,2,3,4,5]` avec `start:1, end:4` → `[2,3,4]`

#### **`unique` - Suppression des Doublons**
```json
{
  "op": "unique",
  "by": "email"
}
```
- **Description** : Supprime les doublons d'un tableau
- **Paramètres** :
  - `by` : Clé d'objet pour la déduplication (optionnel)
- **Exemple** : `["a","b","a","c"]` → `["a","b","c"]`

#### **`sort` - Tri Avancé**
```json
{
  "op": "sort",
  "by": "age",
  "order": "asc",
  "numeric": true,
  "missing_last": true
}
```
- **Description** : Trie un tableau avec options avancées
- **Paramètres** :
  - `by` : Clé d'objet pour le tri (optionnel)
  - `order` : `"asc"` ou `"desc"` (défaut: `"asc"`)
  - `numeric` : Tri numérique si `true` (défaut: `false`)
  - `missing_last` : Place les valeurs manquantes en dernier (défaut: `true`)

### **2. Options de Champ Elasticsearch**

#### **`copy_to` - Copie vers d'Autres Champs**
```json
{
  "target": "name",
  "type": "keyword",
  "copy_to": ["name_all", "searchable_name"]
}
```
- **Description** : Copie la valeur vers d'autres champs
- **Règles** : Pas de self-target, pas de collision avec `.raw`
- **Utilisation** : Création de champs de recherche multiples

#### **`ignore_above` - Limite de Longueur**
```json
{
  "target": "title",
  "type": "keyword",
  "ignore_above": 256
}
```
- **Description** : Limite la longueur des valeurs indexées
- **Restriction** : Uniquement sur les champs `keyword`
- **Avantage** : Optimisation de l'indexation

#### **`null_value` - Valeur par Défaut**
```json
{
  "target": "status",
  "type": "keyword",
  "null_value": "(unknown)"
}
```
- **Description** : Valeur par défaut pour les champs null
- **Restriction** : Interdit sur les champs `text`
- **Support** : `keyword`, `integer`, `long`, `double`, `boolean`, `date`, `ip`

### **3. Propriétés Root Elasticsearch**

#### **`dynamic_templates` - Templates Dynamiques**
```json
{
  "dynamic_templates": [
    {
      "strings": {
        "match_mapping_type": "string",
        "mapping": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    }
  ]
}
```
- **Description** : Règles automatiques pour les nouveaux champs
- **Avantage** : Configuration automatique des mappings

#### **`runtime_fields` - Champs Runtime**
```json
{
  "runtime_fields": {
    "year": {
      "type": "long",
      "script": {
        "source": "emit(doc['created_at'].value.getYear())"
      }
    }
  }
}
```
- **Description** : Champs calculés à la volée
- **Avantage** : Pas d'indexation, calcul dynamique

## 🔧 **Implémentation Technique**

### **1. Mise à Jour du JSON Schema**

Le schéma V2.2 étend le schéma V2.1 avec :
- Nouvelles définitions d'opérations dans `$defs`
- Ajout des opérations dans `pipeline.op.enum`
- Nouvelles propriétés de champ
- Propriétés root Elasticsearch

### **2. Extension de l'Executor**

L'executor principal a été étendu pour supporter :
- Traitement des nouvelles opérations array
- Logique spéciale pour `filter`, `slice`, `unique`, `sort`
- Intégration avec le système de conditions existant

### **3. Validation Renforcée**

Nouvelles règles de validation :
- `ignore_above` uniquement sur `keyword`
- `null_value` interdit sur `text`
- `copy_to` sans self-target
- Prévention des collisions

## 📊 **Exemples Complets**

### **Pipeline Complexe V2.2**
```json
{
  "dsl_version": "2.2",
  "fields": [
    {
      "target": "top_products",
      "type": "keyword",
      "input": [{"kind": "jsonpath", "expr": "$.products[*]"}],
      "pipeline": [
        {"op": "filter", "cond": {"gt": 100}},
        {"op": "sort", "by": "rating", "numeric": true, "order": "desc"},
        {"op": "slice", "start": 0, "end": 5},
        {"op": "map", "then": [{"op": "dict", "key": "name"}]},
        {"op": "join", "sep": " | "}
      ]
    }
  ]
}
```

### **Configuration Avancée de Champ**
```json
{
  "target": "product_name",
  "type": "keyword",
  "ignore_above": 512,
  "null_value": "(unnamed)",
  "copy_to": ["search_all", "product_search"]
}
```

## 🚀 **Migration et Compatibilité**

### **Compatibilité V2.1**
- ✅ Toutes les fonctionnalités V2.1 restent fonctionnelles
- ✅ Aucune régression de performance
- ✅ Schémas existants continuent de fonctionner

### **Migration Progressive**
1. **Phase 1** : Utiliser les nouvelles opérations array
2. **Phase 2** : Ajouter les options de champ ES
3. **Phase 3** : Configurer les propriétés root

## 📈 **Avantages V2.2**

- **Manipulation Avancée** : Opérations array sophistiquées
- **Configuration Fine** : Options Elasticsearch natives
- **Flexibilité** : Templates dynamiques et champs runtime
- **Performance** : Optimisations d'indexation
- **Maintenabilité** : Validation renforcée

## 🔮 **Évolutions Futures**

La V2.2 pose les bases pour :
- **V2.3** : Opérations de jointure entre sources
- **V2.4** : Support des agrégations avancées
- **V2.5** : Intégration avec les pipelines d'ingestion

---

*Documentation V2.2 - Mapping DSL - Version 2.2.0*
