# backend/app/services/validation/utils.py
from typing import Dict, List, Set, Optional, Tuple
from backend.app.domain.analyzer.models import AnalyzerGraph, Node, Kind


def build_adjacency_maps(graph: AnalyzerGraph) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """Construit des listes d'adjacence pour les arêtes sortantes et entrantes."""
    adj: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}
    rev_adj: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}
    for edge in graph.edges:
        adj[edge.source].append(edge.target)
        rev_adj[edge.target].append(edge.source)
    return adj, rev_adj


def find_path_and_nodes(graph: AnalyzerGraph) -> Tuple[List[Node], Set[str]]:
    """
    Trouve le chemin principal de 'input' à 'output' et retourne les nœuds
    qui le composent ainsi que l'ensemble de leurs IDs.
    Lève une ValueError si le chemin est invalide ou non trouvé.
    """
    node_map = {node.id: node for node in graph.nodes}
    adj, _ = build_adjacency_maps(graph)

    try:
        start_node = next(n for n in graph.nodes if n.kind == Kind.input)
        end_node = next(n for n in graph.nodes if n.kind == Kind.output)
    except StopIteration:
        raise ValueError("Les nœuds 'input' et 'output' sont obligatoires.")

    path_nodes: List[Node] = []
    q: List[Node] = [start_node]
    visited_path: Dict[str, Node] = {start_node.id: None}

    # BFS pour trouver le chemin
    head = 0
    while head < len(q):
        current = q[head]
        head += 1
        if current.id == end_node.id:
            break
        for neighbor_id in adj.get(current.id, []):
            if neighbor_id not in visited_path:
                visited_path[neighbor_id] = current
                q.append(node_map[neighbor_id])

    # Reconstruire le chemin
    curr = end_node
    while curr is not None:
        path_nodes.insert(0, curr)
        curr = visited_path.get(curr.id)

    if not path_nodes or path_nodes[0].id != start_node.id:
        raise ValueError("Aucun chemin valide trouvé entre 'input' et 'output'.")

    return path_nodes, {node.id for node in path_nodes}


def find_tokenizer_on_path(path: List[Node]) -> Optional[Node]:
    """Trouve le nœud tokenizer sur un chemin donné."""
    return next((node for node in path if node.kind == Kind.tokenizer), None)
