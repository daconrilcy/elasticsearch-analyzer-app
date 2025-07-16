from app.schemas.analyzer_graph import AnalyzerGraph

def validate_graph_structure(graph: AnalyzerGraph):
    node_ids = {node.id for node in graph.nodes}
    for edge in graph.edges:
        if edge.source not in node_ids:
            raise ValueError(f"Edge source {edge.source} does not correspond to any node.")
        if edge.target not in node_ids:
            raise ValueError(f"Edge target {edge.target} does not correspond to any node.")