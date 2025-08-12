# 📚 **Documentation V2 - Elasticsearch Mapping DSL**

## 🎯 **Vue d'ensemble**

Cette documentation couvre tous les aspects de la **V2** du système de mapping Elasticsearch, de la prise en main aux cas d'usage avancés.

## 📖 **Guides principaux**

### **1. [Guide Utilisateur V2](../README_V2.md)**
- **Nouveautés V2** : Containers, JSONPath, opérations array-aware
- **Exemples de base** : Premiers pas avec la V2
- **Migration V1→V2** : Guide de transition
- **Bonnes pratiques** : Recommandations d'utilisation

### **2. [Guide des Opérations V2](operations_v2.md)**
- **Opérations array-aware** : `map`, `take`, `join`, `flatten`
- **Combinaisons** : Pipelines complexes et optimisés
- **Types de données** : Compatibilité et gestion des erreurs
- **Performance** : Optimisations et limitations

### **3. [Guide de Migration V1→V2](migration_v2.md)**
- **Compatibilité** : Garanties et changements automatiques
- **Plan de migration** : Étapes progressives recommandées
- **Outils** : Scripts et tests de validation
- **Exemples** : Cas concrets de migration

### **4. [Exemples Avancés V2](examples_v2.md)**
- **Cas d'usage réels** : Entreprise, santé, éducation, fabrication
- **Pipelines complexes** : Transformations avancées
- **Structures imbriquées** : Gestion des données complexes
- **Validation** : Contrôles qualité et gestion d'erreurs

## 🔧 **Références techniques**

### **Schémas et validation**
- **JSON Schema V2** : `app/domain/mapping/validators/common/mapping.schema.json`
- **Validation** : Endpoint `/mappings/validate`
- **Compilation** : Endpoint `/mappings/compile`
- **Test** : Endpoint `/mappings/dry-run`

### **Architecture**
- **Exécuteur V2** : `app/domain/mapping/executor/executor.py`
- **Service de mapping** : `app/domain/mapping/services.py`
- **Tests** : `tests/api/v1/test_mappings_v2.py`

## 🧪 **Tests et validation**

### **Suite de tests complète**
```bash
# Tests unitaires V2
python -m pytest tests/api/v1/test_mappings_v2.py

# Tests de performance
python -m pytest tests/performance/test_v2_performance.py

# Tests de régression V1
python -m pytest tests/regression/test_v1_compatibility.py

# Tests complets
python run_v2_tests.py
```

### **Tests d'intégration**
```bash
# Test de l'API V2
python test_api_v2.py

# Test de l'exécuteur V2
python test_executor_v2.py
```

## 📊 **Fonctionnalités V2**

### **🔗 Containers (Conteneurs)**
- **Déclaration explicite** des types `object` et `nested`
- **Gestion automatique** de la structure des données
- **Optimisation** des mappings Elasticsearch

### **🎯 JSONPath**
- **Extraction avancée** de données imbriquées
- **Expressions puissantes** pour accéder aux structures complexes
- **Support complet** de la syntaxe JSONPath

### **⚡ Opérations Array-aware**
- **`map`** : Application de pipeline sur chaque élément
- **`take`** : Sélection d'éléments (first, last, index)
- **`join`** : Concaténation avec séparateur personnalisé
- **`flatten`** : Aplatissement de tableaux imbriqués

### **🔄 Pipelines avancés**
- **Sous-pipelines** conditionnels et imbriqués
- **Gestion d'erreurs** robuste avec fallbacks
- **Optimisation** automatique des performances

## 🚀 **Cas d'usage typiques**

### **Données d'entreprise**
- Gestion des employés et départements
- Projets et heures de travail
- Budgets et ressources

### **Systèmes de santé**
- Patients et visites médicales
- Médicaments et allergies
- Signes vitaux et diagnostics

### **Éducation**
- Étudiants et cours
- Notes et évaluations
- Présence et progression

### **Fabrication**
- Commandes et produits
- Contrôle qualité
- Planning de production

## 📈 **Performance et limitations**

### **Limites techniques**
- **Profondeur** : 10 niveaux d'imbrication max
- **Expressions** : 1000 caractères max
- **Opérations** : 50 par pipeline max
- **Mémoire** : 100MB par document max

### **Optimisations**
- **Compilation** des pipelines
- **Cache** des expressions JSONPath
- **Parallélisation** des opérations array
- **Gestion mémoire** intelligente

## 🔍 **Dépannage et support**

### **Erreurs courantes**
1. **Container non trouvé** : Vérifier la déclaration
2. **Expression JSONPath invalide** : Tester la syntaxe
3. **Pipeline trop complexe** : Diviser en sous-pipelines
4. **Type de données incorrect** : Vérifier les opérations

### **Outils de diagnostic**
- **Logs détaillés** : Traçage des opérations
- **Métriques** : Performance et utilisation
- **Validation** : Vérification des schémas
- **Tests** : Validation avec données réelles

## 📚 **Ressources additionnelles**

### **Documentation externe**
- [JSONPath Syntax](https://goessner.net/articles/JsonPath/)
- [Elasticsearch Nested Types](https://www.elastic.co/guide/en/elasticsearch/reference/current/nested.html)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

### **Exemples de code**
- **Tests unitaires** : `tests/api/v1/test_mappings_v2.py`
- **Tests de performance** : `tests/performance/test_v2_performance.py`
- **Scripts utilitaires** : `run_v2_tests.py`, `test_api_v2.py`

## 🎯 **Prochaines étapes**

### **Pour les utilisateurs V1**
1. **Lire** le guide de migration
2. **Tester** la compatibilité
3. **Migrer** progressivement
4. **Exploiter** les nouvelles fonctionnalités

### **Pour les nouveaux utilisateurs**
1. **Commencer** par le guide utilisateur
2. **Expérimenter** avec les exemples de base
3. **Progresser** vers les cas d'usage avancés
4. **Optimiser** avec les bonnes pratiques

### **Pour les développeurs**
1. **Comprendre** l'architecture V2
2. **Contribuer** aux tests et exemples
3. **Proposer** de nouvelles fonctionnalités
4. **Documenter** les cas d'usage

---

**🎉 La V2 ouvre de nouvelles possibilités pour la gestion de données complexes dans Elasticsearch !**

**📞 Besoin d'aide ? Consultez la documentation ou créez une issue sur le projet.**
