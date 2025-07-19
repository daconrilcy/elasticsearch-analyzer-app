import json
from typing import List, Dict, Any, Tuple, Optional
from elasticsearch import AsyncElasticsearch
from app.schemas.analyzer_graph import AnalyzerGraph, Node
from app.services.graph_converter import convert_graph_to_es_analyzer, _find_start_node, _build_lookup_maps

async def debug_analyzer_step_by_step(
    graph: AnalyzerGraph, text: str, es_client: AsyncElasticsearch
) -> Tuple[List[Dict[str, Any]], Dict[str, List[str]]]:
    """
    Analyse un texte en suivant le graphe pas à pas et retourne les résultats intermédiaires
    ainsi que le chemin de graphe valide.
    """
    results: List[Dict[str, Any]] = []
    
    results.append({"step_name": "Input Text", "output": text})

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

        sub_graph_nodes = pipeline_nodes[:i+1]
        
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
            settings=graph.settings # <--- LIGNE AJOUTÉE
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