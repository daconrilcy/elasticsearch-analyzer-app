# Fichier : backend/app/services/graph_converter.py

from typing import Dict, Any, List, Optional
from app.schemas.analyzer_graph import AnalyzerGraph, Kind, Node
from app.registry.loader import get_component_definition

# --- Fonctions utilitaires (inchangées) ---
def _build_lookup_maps(graph: AnalyzerGraph) -> tuple[Dict[str, Node], Dict[str, str]]:
    node_map = {node.id: node for node in graph.nodes}
    edge_map = {edge.source: edge.target for edge in graph.edges}
    return node_map, edge_map

def _find_start_node(graph: AnalyzerGraph) -> Node:
    try:
        return next(n for n in graph.nodes if n.kind == Kind.input)
    except StopIteration:
        raise ValueError("Le graphe est invalide : il doit contenir un nœud 'input'.")

def _convert_param_value(value: Any, param_def: Dict[str, Any]) -> Any:
    param_type = param_def.get("type")
    field_type = param_def.get("field", {}).get("itemType")
    
    try:
        if param_type == "integer" or field_type == "number":
            return int(value)
        if param_type == "boolean" or field_type == "checkbox":
            return bool(value)
        return value
    except (ValueError, TypeError):
        raise ValueError(f"Impossible de convertir le paramètre '{param_def['name']}' avec la valeur '{value}' vers le type attendu.")

# --- Fonction principale (CORRIGÉE) ---
def convert_graph_to_es_analyzer(graph: AnalyzerGraph) -> Dict:
    """
    Convertit le graphe en une définition d'analyseur valide pour l'API _analyze,
    en plaçant les définitions de composants directement dans les listes.
    """
    node_map, edge_map = _build_lookup_maps(graph)
    current_node: Optional[Node] = _find_start_node(graph)

    # Les listes contiendront soit des strings (ex: "lowercase"), soit des dictionnaires
    char_filters: List[str | Dict] = []
    token_filters: List[str | Dict] = []
    tokenizer: Optional[str | Dict] = None

    while current_node:
        target_id = edge_map.get(current_node.id)
        if not target_id: break
        next_node = node_map.get(target_id)
        if not next_node: break
        
        node_kind = next_node.kind.value
        node_name = next_node.name
        
        # Cas 1 : Le nœud a des paramètres -> on crée un objet de définition complet
        if next_node.params:
            component_def = get_component_definition(node_kind, node_name)
            if not component_def or not component_def.get("params"):
                raise ValueError(f"Définition introuvable pour les paramètres de '{node_name}'.")

            converted_params = {}
            for param_name, param_value in next_node.params.items():
                param_def = next((p for p in component_def["params"]["elements"] if p["name"] == param_name), None)
                if not param_def: raise ValueError(f"Définition du paramètre '{param_name}' introuvable.")
                converted_params[param_name] = _convert_param_value(param_value, param_def)
            
            definition = {"type": node_name, **converted_params}

            if node_kind == "char_filter": char_filters.append(definition)
            elif node_kind == "token_filter": token_filters.append(definition)
            elif node_kind == "tokenizer":
                if tokenizer is not None: raise ValueError("Un seul tokenizer autorisé.")
                tokenizer = definition
        
        # Cas 2 : Le nœud n'a pas de paramètres -> on utilise juste son nom (string)
        else:
            if node_kind == "char_filter": char_filters.append(node_name)
            elif node_kind == "token_filter": token_filters.append(node_name)
            elif node_kind == "tokenizer":
                if tokenizer is not None: raise ValueError("Un seul tokenizer autorisé.")
                tokenizer = node_name

        current_node = next_node

    # --- Assemblage final ---
    final_tokenizer = tokenizer if tokenizer is not None else "standard"
    
    # La structure est maintenant plus simple et ne nécessite plus de fusion.
    analyzer_definition = {
        "tokenizer": final_tokenizer,
        "char_filter": char_filters,
        "filter": token_filters,
    }
    
    return analyzer_definition