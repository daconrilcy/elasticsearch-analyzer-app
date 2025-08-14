# ⚡ **Guide des Opérations V2 - Elasticsearch Mapping DSL**

## 📋 **Vue d'ensemble des opérations**

La V2 introduit de nouvelles opérations **array-aware** qui permettent de manipuler efficacement les tableaux et structures de données complexes.

## 🔄 **Opérations Array-aware**

### **1. `map` - Application de pipeline sur chaque élément**

**Description :** Applique un sous-pipeline sur chaque élément d'un tableau ou sur une valeur unique.

**Syntaxe :**
```json
{
  "op": "map",
  "then": [
    // Sous-pipeline à appliquer
  ]
}
```

**Paramètres :**
- `then` : Array d'opérations à exécuter sur chaque élément

**Exemples :**

```json
// Nettoyage de tous les téléphones
{
  "op": "map",
  "then": [
    {"op": "trim"},
    {"op": "lower"}
  ]
}
```

```json
// Transformation conditionnelle
{
  "op": "map",
  "then": [
    {
      "op": "when",
      "cond": {"gt": 0},
      "then": [{"op": "cast", "to": "long"}],
      "else": [{"op": "literal", "value": 0}]
    }
  ]
}
```

**Comportement :**
- Si l'input est un tableau : applique le pipeline sur chaque élément
- Si l'input est une valeur unique : applique le pipeline sur cette valeur
- Retourne toujours un tableau si l'input était un tableau

### **2. `take` - Sélection d'éléments**

**Description :** Sélectionne un ou plusieurs éléments d'un tableau.

**Syntaxe :**
```json
{
  "op": "take",
  "which": "first" | "last" | <index>
}
```

**Paramètres :**
- `which` : 
  - `"first"` : Premier élément
  - `"last"` : Dernier élément
  - `<index>` : Index numérique (0-based)

**Exemples :**

```json
// Premier élément
{
  "op": "take",
  "which": "first"
}
```

```json
// Troisième élément (index 2)
{
  "op": "take",
  "which": 2
}
```

**Comportement :**
- Si l'input n'est pas un tableau : retourne l'input tel quel
- Si l'index est hors limites : retourne `null`
- Retourne une valeur unique (pas un tableau)

### **3. `join` - Concaténation d'éléments**

**Description :** Joint tous les éléments d'un tableau en une seule chaîne.

**Syntaxe :**
```json
{
  "op": "join",
  "sep": "<séparateur>"
}
```

**Paramètres :**
- `sep` : Séparateur entre les éléments (défaut : ", ")

**Exemples :**

```json
// Jointure avec virgule
{
  "op": "join",
  "sep": ", "
}
```

```json
// Jointure avec pipe
{
  "op": "join",
  "sep": "|"
}
```

**Comportement :**
- Si l'input n'est pas un tableau : convertit en chaîne
- Les valeurs `null` sont traitées comme chaînes vides
- Retourne toujours une chaîne

### **4. `flatten` - Aplatissement de tableaux**

**Description :** Aplatit les tableaux imbriqués en un seul niveau.

**Syntaxe :**
```json
{
  "op": "flatten"
}
```

**Exemples :**

```json
// Aplatissement simple
{
  "op": "flatten"
}
```

**Comportement :**
- Input : `[[1, 2], [3], 4]`
- Output : `[1, 2, 3, 4]`
- Si l'input n'est pas un tableau : retourne l'input tel quel
- Retourne toujours un tableau

## 🔗 **Combinaisons d'opérations**

### **Pipeline de nettoyage complet**

```json
{
  "op": "map",
  "then": [
    {"op": "trim"},
    {"op": "lower"},
    {"op": "regex_replace", "pattern": "\\s+", "replacement": "_"}
  ]
}
```

### **Extraction et formatage**

```json
[
  {
    "op": "take",
    "which": "first"
  },
  {
    "op": "concat",
    "sep": " - ",
    "values": [
      {"kind": "jsonpath", "expr": "$"},
      {"kind": "literal", "value": "processed"}
    ]
  }
]
```

### **Transformation conditionnelle complexe**

```json
{
  "op": "map",
  "then": [
    {
      "op": "when",
      "cond": {"contains": "phone"},
      "then": [
        {
          "op": "concat",
          "sep": " - ",
          "values": [
            {"kind": "jsonpath", "expr": "$.phone"},
            {"kind": "jsonpath", "expr": "$.email"}
          ]
        }
      ],
      "else": [
        {"op": "literal", "value": "no_contact"}
      ]
    }
  ]
}
```

## 📊 **Types de données et compatibilité**

### **Compatibilité des types**

| Opération | Input Array | Input Scalar | Output |
|-----------|-------------|--------------|---------|
| `map`     | ✅ Array    | ✅ Scalar    | Array/Value |
| `take`    | ✅ Array    | ✅ Scalar    | Value |
| `join`    | ✅ Array    | ✅ Scalar    | String |
| `flatten` | ✅ Array    | ✅ Scalar    | Array/Value |

### **Gestion des valeurs nulles**

- **`map`** : Traite `null` comme une valeur valide
- **`take`** : Retourne `null` si l'index n'existe pas
- **`join`** : Convertit `null` en chaîne vide
- **`flatten`** : Préserve les valeurs `null`

## ⚠️ **Limitations et bonnes pratiques**

### **Limitations techniques**

1. **Profondeur maximale** : 10 niveaux d'imbrication
2. **Taille des expressions** : 1000 caractères max
3. **Opérations par pipeline** : 50 max
4. **Mémoire** : 100MB max par document

### **Bonnes pratiques**

1. **Ordre des opérations** : Placer `flatten` avant `join`
2. **Gestion des erreurs** : Utiliser `when` pour les cas d'erreur
3. **Performance** : Éviter les pipelines trop longs
4. **Test** : Valider avec des données réelles

### **Anti-patterns à éviter**

```json
// ❌ Mauvais : Pipeline trop long
{
  "op": "map",
  "then": [
    // 20+ opérations...
  ]
}

// ✅ Bon : Pipeline divisé
{
  "op": "map",
  "then": [
    {"op": "clean_data"},
    {"op": "transform_data"}
  ]
}
```

## 🔍 **Débogage et diagnostic**

### **Logs de débogage**

```json
{
  "op": "debug",
  "label": "avant_map"
}
```

### **Validation des pipelines**

```bash
# Validation du schéma
curl -X POST /mappings/validate -d @mapping.json

# Test avec données réelles
curl -X POST /mappings/dry-run -d @test_data.json
```

### **Métriques de performance**

- Temps d'exécution par opération
- Utilisation mémoire
- Nombre d'éléments traités
- Taux d'erreur

## 📚 **Exemples avancés**

### **Exemple 1 : Traitement de logs**

```json
{
  "op": "map",
  "then": [
    {
      "op": "when",
      "cond": {"contains": "ERROR"},
      "then": [
        {"op": "regex_extract", "pattern": "ERROR: (.+)"},
        {"op": "upper"}
      ],
      "else": [
        {"op": "regex_extract", "pattern": "INFO: (.+)"}
      ]
    }
  ]
}
```

### **Exemple 2 : Agrégation de données**

```json
[
  {
    "op": "map",
    "then": [
      {"op": "cast", "to": "long"}
    ]
  },
  {
    "op": "when",
    "cond": {"gt": 100},
    "then": [
      {"op": "literal", "value": "high"}
    ],
    "else": [
      {"op": "literal", "value": "low"}
    ]
  }
]
```

---

**🎯 Les opérations array-aware de la V2 offrent une puissance sans précédent pour la transformation de données complexes !**
