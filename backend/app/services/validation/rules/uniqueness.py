# backend/app/services/validation/rules/uniqueness.py
from collections import Counter
from app.schemas.analyzer_graph import AnalyzerGraph, Kind
from ..loader import RegistryLoader

def validate_node_uniqueness(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide la présence et l'unicité des nœuds critiques.

    Règles vérifiées :
    - Il doit y avoir exactement un nœud 'input'.
    - Il doit y avoir exactement un nœud 'output'.
    - Il doit y avoir exactement un nœud 'tokenizer'.

    Args:
        graph: L'objet AnalyzerGraph à valider.
        definitions: Le chargeur de définitions (non utilisé ici, mais requis par l'interface).

    Raises:
        ValueError: Si une des règles d'unicité n'est pas respectée.
    """
    kind_counts = Counter(node.kind for node in graph.nodes)

    if kind_counts[Kind.input] != 1:
        raise ValueError(f"Le graphe doit contenir exactement un nœud 'input', mais {kind_counts[Kind.input]} trouvé(s).")
    
    if kind_counts[Kind.output] != 1:
        raise ValueError(f"Le graphe doit contenir exactement un nœud 'output', mais {kind_counts[Kind.output]} trouvé(s).")

    if kind_counts[Kind.tokenizer] != 1:
        raise ValueError(f"Le graphe doit contenir exactement un nœud 'tokenizer', mais {kind_counts[Kind.tokenizer]} trouvé(s).")
