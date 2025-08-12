# Nouveaux Endpoints CRUD et Versioning

## Vue d'ensemble

Cette implémentation ajoute la gestion complète des mappings et dictionnaires avec versioning, en s'alignant sur le pattern existant des datasets.

## 1. Endpoints Mappings CRUD + Versioning

### Endpoints CRUD de base

- **`POST /api/v1/mappings/`** - Créer un nouveau mapping
- **`GET /api/v1/mappings/`** - Lister les mappings (avec filtrage par dataset)
- **`GET /api/v1/mappings/{id}`** - Récupérer un mapping avec ses versions
- **`PUT /api/v1/mappings/{id}`** - Mettre à jour un mapping
- **`DELETE /api/v1/mappings/{id}`** - Supprimer un mapping et ses versions

### Endpoints de versioning

- **`POST /api/v1/mappings/{id}/versions`** - Créer une nouvelle version
- **`PUT /api/v1/mappings/versions/{version_id}`** - Mettre à jour une version
- **`DELETE /api/v1/mappings/versions/{version_id}`** - Supprimer une version

### Endpoints de validation DSL (existants)

- **`POST /api/v1/mappings/validate`** - Valider un mapping DSL
- **`POST /api/v1/mappings/compile`** - Compiler un mapping DSL
- **`POST /api/v1/mappings/dry-run`** - Exécuter un dry-run

## 2. Endpoints Dictionaries CRUD + Versioning

### Endpoints CRUD de base

- **`POST /api/v1/dictionaries/`** - Créer un nouveau dictionnaire
- **`GET /api/v1/dictionaries/`** - Lister les dictionnaires (paginated)
- **`GET /api/v1/dictionaries/{id}`** - Récupérer un dictionnaire avec ses versions
- **`PUT /api/v1/dictionaries/{id}`** - Mettre à jour un dictionnaire
- **`DELETE /api/v1/dictionaries/{id}`** - Supprimer un dictionnaire et ses versions

### Endpoints de versioning

- **`POST /api/v1/dictionaries/{id}/versions`** - Créer une nouvelle version
- **`PUT /api/v1/dictionaries/versions/{version_id}`** - Mettre à jour une version
- **`DELETE /api/v1/dictionaries/versions/{version_id}`** - Supprimer une version

## 3. Modèles de données

### MappingVersion

```python
class MappingVersion(Base):
    __tablename__ = "mapping_versions"
    
    id = Column(UUID, primary_key=True)
    mapping_id = Column(UUID, ForeignKey("mappings.id"))
    version = Column(Integer, default=1)
    dsl_content = Column(JSONB)  # Contenu DSL
    compiled_mapping = Column(JSONB)  # Cache du mapping ES
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    version_metadata = Column(JSONB)  # Métadonnées
    created_at = Column(DateTime)
    created_by = Column(UUID, ForeignKey("users.id"))
```

### DictionaryVersion

```python
class DictionaryVersion(Base):
    __tablename__ = "dictionary_versions"
    
    id = Column(UUID, primary_key=True)
    dictionary_id = Column(UUID, ForeignKey("dictionaries.id"))
    version = Column(Integer, default=1)
    data = Column(JSONB)  # Contenu (stopwords, synonymes, etc.)
    is_active = Column(Boolean, default=True)
    version_metadata = Column(JSONB)  # Métadonnées
    created_at = Column(DateTime)
    created_by = Column(UUID, ForeignKey("users.id"))
```

## 4. Fonctionnalités clés

### Versioning automatique

- **Numérotation automatique** : Chaque nouvelle version obtient le numéro suivant
- **Gestion des versions actives** : Une seule version active par entité
- **Désactivation automatique** : L'ancienne version active est désactivée lors de la création d'une nouvelle

### Sécurité et permissions

- **Vérification de propriété** : Accès uniquement aux ressources de l'utilisateur
- **Héritage des permissions** : Accès aux mappings via les datasets
- **Validation des références** : Vérification de l'existence des entités liées

### Intégrité des données

- **Protection contre la suppression** : Impossible de supprimer la seule version
- **Cascade automatique** : Suppression des versions lors de la suppression de l'entité parente
- **Contraintes de base** : Unicité des combinaisons (entité_id, version)

## 5. Exemples d'utilisation

### Créer un mapping avec version DSL

```bash
curl -X POST "http://localhost:8000/api/v1/mappings/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Mapping",
    "source_file_id": "uuid",
    "mapping_rules": []
  }'
```

### Créer une version DSL d'un mapping

```bash
curl -X POST "http://localhost:8000/api/v1/mappings/{mapping_id}/versions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dsl_content": {
      "index": "users",
      "globals": {...},
      "id_policy": {...},
      "fields": [...]
    },
    "description": "Version avec support des dates",
    "is_active": true
  }'
```

### Créer un dictionnaire de stopwords

```bash
curl -X POST "http://localhost:8000/api/v1/dictionaries/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "French Stopwords",
    "description": "Mots vides français",
    "type": "stopwords",
    "data": ["le", "la", "les", "de", "du", "des"],
    "version_metadata": {"language": "fr", "source": "manual"}
  }'
```

## 6. Schémas de réponse

### Mapping avec versions

```json
{
  "id": "uuid",
  "name": "User Mapping",
  "source_file_id": "uuid",
  "mapping_rules": [],
  "dataset_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "index_name": null,
  "versions": [
    {
      "id": "uuid",
      "mapping_id": "uuid",
      "version": 1,
      "dsl_content": {...},
      "compiled_mapping": {...},
      "description": "Version initiale",
      "is_active": true,
      "version_metadata": {...},
      "created_at": "2024-01-01T00:00:00Z",
      "created_by": "uuid"
    }
  ],
  "active_version": {...}
}
```

### Dictionnaire avec versions

```json
{
  "id": "uuid",
  "name": "French Stopwords",
  "description": "Mots vides français",
  "type": "stopwords",
  "owner_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "versions": [
    {
      "id": "uuid",
      "dictionary_id": "uuid",
      "version": 1,
      "data": ["le", "la", "les"],
      "is_active": true,
      "version_metadata": {"language": "fr"},
      "created_at": "2024-01-01T00:00:00Z",
      "created_by": "uuid"
    }
  ],
  "active_version": {...}
}
```

## 7. Gestion des erreurs

### Erreurs communes

- **403 Forbidden** : Accès non autorisé à la ressource
- **404 Not Found** : Ressource ou version non trouvée
- **400 Bad Request** : Tentative de suppression de la seule version
- **422 Validation Error** : Données de requête invalides

### Messages d'erreur

```json
{
  "detail": "Impossible de supprimer la seule version d'un mapping"
}
```

## 8. Tests

### Lancer les tests existants

```bash
python -m pytest tests/api/v1/test_mappings.py -v
```

### Tester l'application

```bash
python -c "from main import app; print('✅ Application OK')"
```

## 9. Exécuteur de Dry-Run

### Intégration de l'exécuteur

L'exécuteur est maintenant intégré dans le service `MappingService.dry_run()` et remplace le stub précédent. Il exécute la pipeline de mapping DSL sur des échantillons de données sans accès à Elasticsearch.

### Fonctionnalités de l'exécuteur

- **Prévisualisation des résultats** : Génère `docs_preview` avec le JSON tel qu'il serait indexé
- **Détection des problèmes** : Identifie les erreurs non bloquantes (dates non parsées, opérations inconnues, etc.)
- **Test des politiques d'ID** : Vérifie la stabilité et l'unicité des `_id` via `id_policy`
- **Validation des globals** : Applique les règles de nulls, booléens, décimales et timezone
- **Sémantique front/back** : Même moteur que celui utilisé pour l'ingestion réelle

### Utilisation

```python
# Dans le service
from app.domain.mapping.executor import run_dry_run

def dry_run(mapping: dict, sample: dict) -> "DryRunOut":
    rows = sample.get("rows", [])
    result = run_dry_run(mapping, rows)
    return DryRunOut(**result)
```

```bash
# Endpoint API
POST /api/v1/mappings/dry-run
{
  "index": "users",
  "globals": {...},
  "id_policy": {...},
  "fields": [...],
  "rows": [
    {"col1": "val1", "col2": "val2"},
    {"col1": "val3", "col2": "val4"}
  ]
}
```

### Opérations supportées

- **Inputs** : `column`, `literal` (jsonpath toléré mais non exécuté)
- **Transformations** : `trim`, `lower`, `upper`, `regex_replace`, `cast`, `dict`, `concat`, `split`, `coalesce`
- **Parsing** : `date_parse`, `geo_parse`, `phonetic`
- **Utilitaires** : `hash`, `when` (conditionnel)

## 10. Extensions futures

- **Historique des versions** : Suivi des changements entre versions
- **Diff des versions** : Comparaison visuelle des changements
- **Rollback automatique** : Retour à une version précédente
- **Tags et labels** : Organisation des versions par fonctionnalité
- **Approbation des versions** : Workflow de validation avant activation
- **Tests de performance** : Benchmark de l'exécuteur sur de gros volumes
- **Cache des résultats** : Mise en cache des transformations fréquentes
