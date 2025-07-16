from app.schemas.analyzer_graph import AnalyzerGraph
from app.registry.compat import is_token_filter_compatible

def validate_token_filter_compat(graph: AnalyzerGraph):
    tokenizer = next((n for n in graph.nodes if n.kind == "tokenizer"), None)
    if not tokenizer:
        raise ValueError("No tokenizer node found.")
    token_filters = [n for n in graph.nodes if n.kind == "token_filter"]
    for tf in token_filters:
        if not is_token_filter_compatible(tokenizer.name, tf.name):
            raise ValueError(
                f"Token filter '{tf.name}' is not compatible with tokenizer '{tokenizer.name}'."
            )
