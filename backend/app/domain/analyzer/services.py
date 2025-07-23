import json
from typing import List, Dict, Any, Tuple, Optional
from elasticsearch import AsyncElasticsearch
from backend.app.domain.analyzer.models import AnalyzerGraph, Node, Kind
from backend.app.domain.analyzer.component_loader import get_component_definition


async def debug_analyzer_step_by_step(
        graph: AnalyzerGraph, text: str, es_client: AsyncElasticsearch
) -> Tuple[List[Dict[str, Any]], Dict[str, List[str]]]:
    """
    Analyse un texte en suivant le graphe pas à pas et retourne les résultats intermédiaires
    ainsi que le chemin de graphe valide.
    """
    results: List[Dict[str, Any]] = [{"step_name": "Input Text", "output": text}]

    node_map, edge_map = _build_lookup_maps(graph)
    current_node: Optional[Node] = _find_start_node(graph)

    pipeline_nodes: List[Node] = []
    valid_path: Dict[str, List[str]] = {"nodes": [], "edges": []}

    temp_node = current_node
    while temp_node:
        pipeline_nodes.append(temp_node)
        target_id = edge_map.get(temp_node.id)
        if not target_id: break
        temp_node = node_map.get(target_id)

    for i, node in enumerate(pipeline_nodes):
        if node.kind == 'input':
            valid_path["nodes"].append(node.id)
            continue

        sub_graph_nodes = pipeline_nodes[:i + 1]

        output_node = next((n for n in graph.nodes if n.kind == 'output'), None)
        if output_node:
            sub_graph_nodes.append(output_node)

        sub_graph_edges = [
            edge for edge in graph.edges
            if edge.source in {n.id for n in sub_graph_nodes}
               and edge.target in {n.id for n in sub_graph_nodes}
        ]

        # ▼▼▼ CORRECTION APPLIQUÉE ICI ▼▼▼
        # On passe maintenant le paramètre `settings` depuis le graphe original.
        sub_graph = AnalyzerGraph(
            nodes=sub_graph_nodes,
            edges=sub_graph_edges,
            id=graph.id,
            name=graph.name,
            version=graph.version,
            settings=graph.settings  # <--- LIGNE AJOUTÉE
        )

        try:
            analyzer_definition = convert_graph_to_es_analyzer(sub_graph)

            print(f"--- Définition pour l'étape '{node.name}' ---")
            print(json.dumps(analyzer_definition, indent=2, ensure_ascii=False))
            print("--------------------------------------------------")

            request_body = {"text": text, **analyzer_definition}

            response = await es_client.indices.analyze(body=request_body)

            tokens = [token_info['token'] for token_info in response.get("tokens", [])]
            results.append({"step_name": f"After '{node.name}' ({node.kind.value})", "output": tokens})

            valid_path["nodes"].append(node.id)
            edge_to_node = next((e for e in graph.edges if e.target == node.id), None)
            if edge_to_node and edge_to_node.id:
                valid_path["edges"].append(edge_to_node.id)

        except Exception as e:
            print(f"ERREUR lors de l'analyse à l'étape '{node.name}': {e}")
            results.append({"step_name": f"Error at '{node.name}'", "output": ["Analysis failed at this step."]})
            break

    return results, valid_path


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
        raise ValueError(
            f"Impossible de convertir le paramètre '{param_def['name']}' avec la valeur '{value}' vers le type attendu.")


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

            if node_kind == "char_filter":
                char_filters.append(definition)
            elif node_kind == "token_filter":
                token_filters.append(definition)
            elif node_kind == "tokenizer":
                if tokenizer is not None: raise ValueError("Un seul tokenizer autorisé.")
                tokenizer = definition

        # Cas 2 : Le nœud n'a pas de paramètres -> on utilise juste son nom (string)
        else:
            if node_kind == "char_filter":
                char_filters.append(node_name)
            elif node_kind == "token_filter":
                token_filters.append(node_name)
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
