# backend/app/services/validation/rules/graph_structure.py
from app.schemas.analyzer_graph import AnalyzerGraph
from ..loader import RegistryLoader
from app.services.validation import utils

def validate_graph_connectivity(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide que tous les nœuds du graphe sont connectés au chemin principal.

    Un nœud orphelin (non connecté au chemin entre 'input' et 'output')
    est considéré comme une erreur de configuration.

    Args:
        graph: L'objet AnalyzerGraph à valider.
        definitions: Le chargeur de définitions.

    Raises:
        ValueError: Si un ou plusieurs nœuds orphelins sont détectés.
    """
    _, path_node_ids = utils.find_path_and_nodes(graph)
    all_node_ids = {node.id for node in graph.nodes}

    if path_node_ids != all_node_ids:
        orphan_ids = all_node_ids - path_node_ids
        raise ValueError(f"Nœuds orphelins détectés. Tous les nœuds doivent être connectés au chemin principal. Nœuds non connectés : {', '.join(orphan_ids)}")

def validate_acyclic(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide que le graphe est un Graphe Acyclique Dirigé (DAG).

    Utilise un algorithme de parcours en profondeur (DFS) pour détecter les cycles.

    Args:
        graph: L'objet AnalyzerGraph à valider.
        definitions: Le chargeur de définitions.

    Raises:
        ValueError: Si un cycle est détecté dans le graphe.
    """
    adj, _ = utils.build_adjacency_maps(graph)
    visiting = set()
    visited = set()

    for node_id in adj:
        if node_id not in visited:
            if _has_cycle_dfs(node_id, adj, visiting, visited):
                raise ValueError("Un cycle a été détecté dans le graphe. Le pipeline doit être linéaire.")

def _has_cycle_dfs(node_id, adj, visiting, visited):
    visiting.add(node_id)
    for neighbor_id in adj.get(node_id, []):
        if neighbor_id in visiting:
            return True  # Cycle détecté
        if neighbor_id not in visited:
            if _has_cycle_dfs(neighbor_id, adj, visiting, visited):
                return True
    visiting.remove(node_id)
    visited.add(node_id)
    return False
