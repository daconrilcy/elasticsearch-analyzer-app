# Tests V2.1 - Mapping DSL
# 
# Structure organisée des tests V2.1 :
#
# tests/
# ├── domain/
# │   └── mapping/
# │       └── test_dsl_v21.py          # Tests DSL V2.1 (validation, compilation)
# ├── api/
# │   └── v1/
# │       └── test_mappings_v21.py     # Tests API endpoints V2.1
# ├── integration/
# │   └── test_production_v21.py       # Tests d'intégration production V2.1
# └── utils/
#     └── test_auth_helpers.py         # Helpers d'authentification V2.1
#
# Tests V2.1 couverts :
# - Validation et compilation DSL V2.1
# - Containers (nested/object)
# - Opérations zip/objectify
# - Cache JSONPath
# - Génération automatique ILM/Ingest
# - Endpoint /apply
# - Métriques et monitoring
# - Performance et production
