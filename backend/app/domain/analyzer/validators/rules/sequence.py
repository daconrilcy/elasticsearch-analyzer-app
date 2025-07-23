# backend/app/services/validation/rules/sequence.py
from backend.app.domain.analyzer.models import AnalyzerGraph, Kind
from backend.app.domain.analyzer.registry_loader import RegistryLoader
from backend.app.domain.analyzer.validators import utils


def validate_node_sequence(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide l'ordre séquentiel des types de nœuds dans le pipeline.

    Règles vérifiées :
    - Les 'char_filter' ne peuvent apparaître qu'avant le 'tokenizer'.
    - Les 'token_filter' ne peuvent apparaître qu'après le 'tokenizer'.
    """
    path_nodes, _ = utils.find_path_and_nodes(graph)

    tokenizer_found = False
    for node in path_nodes:
        if node.kind == Kind.tokenizer:
            tokenizer_found = True
            continue

        if node.kind == Kind.char_filter and tokenizer_found:
            raise ValueError(f"Erreur de séquence : le char_filter '{node.name}' est placé après le tokenizer.")

        if node.kind == Kind.token_filter and not tokenizer_found:
            raise ValueError(f"Erreur de séquence : le token_filter '{node.name}' est placé avant le tokenizer.")
