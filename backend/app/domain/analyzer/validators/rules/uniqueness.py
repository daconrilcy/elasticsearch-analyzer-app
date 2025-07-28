""" backend/app/services/validation/rules/uniqueness.py """
from collections import Counter
from app.domain.analyzer.models import AnalyzerGraph, Kind
from app.domain.analyzer.registry_loader import RegistryLoader
from loguru import logger


def validate_node_uniqueness(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide la présence et l'unicité des nœuds critiques.

    Règles vérifiées :
    - Il doit y avoir exactement un nœud 'input'.
    - Il doit y avoir exactement un nœud 'output'.
    - Il doit y avoir exactement un nœud 'tokenizer'.
    """
    kind_counts = Counter(node.kind for node in graph.nodes)

    if kind_counts[Kind.input] != 1:
        raise ValueError(
            f"Le graphe doit contenir exactement un nœud 'input', mais {kind_counts[Kind.input]} trouvé(s).")

    if kind_counts[Kind.output] != 1:
        raise ValueError(
            f"Le graphe doit contenir exactement un nœud 'output', mais {kind_counts[Kind.output]} trouvé(s).")

    if kind_counts[Kind.tokenizer] != 1:
        raise ValueError(
            f"Le graphe doit contenir exactement un nœud 'tokenizer', mais {kind_counts[Kind.tokenizer]} trouvé(s).")
