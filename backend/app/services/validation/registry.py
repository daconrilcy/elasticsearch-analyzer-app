# backend/app/services/validation/registry.py
from .rules import (
    uniqueness,
    graph_structure,
    sequence,
    compatibility,
    params
)

# Registre central des fonctions de validation à exécuter.
# L'ordre est important : on vérifie d'abord la structure de base
# avant de valider des règles plus complexes.
VALIDATION_RULES = [
    # 1. Règles de base sur la présence et l'unicité des nœuds critiques
    uniqueness.validate_node_uniqueness,

    # 2. Règles sur la structure du graphe (connexité, cycles)
    graph_structure.validate_graph_connectivity,
    graph_structure.validate_acyclic,

    # 3. Règles sur l'ordre séquentiel des composants
    sequence.validate_node_sequence,

    # 4. Règles de compatibilité entre composants
    compatibility.validate_token_filter_compatibility,

    # 5. Validation des paramètres de chaque nœud
    params.validate_all_node_params,
]
