# backend/app/services/validation/rules/compatibility.py
from backend.app.domain.analyzer.models import AnalyzerGraph, Kind
from backend.app.domain.analyzer.registry_loader import RegistryLoader
from ..utils import find_path_and_nodes, find_tokenizer_on_path

def validate_token_filter_compatibility(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide que chaque token_filter est compatible avec le tokenizer utilisé.

    Args:
        graph: L'objet AnalyzerGraph à valider.
        definitions: Instance de RegistryLoader contenant les règles de compatibilité.

    Raises:
        ValueError: Si un token_filter est incompatible.
    """
    path_nodes, _ = find_path_and_nodes(graph)
    tokenizer_node = find_tokenizer_on_path(path_nodes)

    if not tokenizer_node:
        # Cette erreur devrait être captée par la règle d'unicité, mais c'est une sécurité.
        return

    token_filters_on_path = [n for n in path_nodes if n.kind == Kind.token_filter]
    compatibility_rules = definitions.get_compatibility(tokenizer_node.name)

    if compatibility_rules is None:
        # Si un tokenizer n'a pas de règles définies, on suppose que tout est permis.
        return

    for tf_node in token_filters_on_path:
        is_compatible = compatibility_rules.get(tf_node.name)

        if is_compatible is False:
            raise ValueError(
                f"Le token_filter '{tf_node.name}' est explicitement incompatible avec le tokenizer '{tokenizer_node.name}'.")

        # Gère le cas "*" (wildcard)
        wildcard_rule = compatibility_rules.get("*")
        if wildcard_rule == "partial" and is_compatible is not True:
            raise ValueError(
                f"Le token_filter '{tf_node.name}' n'est pas listé comme compatible avec le tokenizer '{tokenizer_node.name}' (règle 'partial').")

        if wildcard_rule is False and is_compatible is not True:
            raise ValueError(
                f"Le token_filter '{tf_node.name}' n'est pas compatible avec le tokenizer '{tokenizer_node.name}' (règle '*: false').")
