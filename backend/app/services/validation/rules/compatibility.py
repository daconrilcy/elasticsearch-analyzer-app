# backend/app/services/validation/rules/compatibility.py
from app.schemas.analyzer_graph import AnalyzerGraph, Kind
from ..loader import RegistryLoader
from app.services.validation import utils

def validate_token_filter_compatibility(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide que chaque token_filter est compatible avec le tokenizer utilisé.

    Args:
        graph: L'objet AnalyzerGraph à valider.
        definitions: Le chargeur de définitions contenant les règles de compatibilité.

    Raises:
        ValueError: Si un token_filter est incompatible.
    """
    path_nodes, _ = utils.find_path_and_nodes(graph)
    tokenizer_node = utils.find_tokenizer_on_path(path_nodes)
    
    if not tokenizer_node:
        # Cette erreur devrait être captée par la règle d'unicité, mais c'est une sécurité.
        return

    token_filters_on_path = [n for n in path_nodes if n.kind == Kind.token_filter]
    compatibility_rules = definitions.get_compatibility_rules(tokenizer_node.name)

    if compatibility_rules is None:
        # Si un tokenizer n'a pas de règles définies, on suppose que tout est permis.
        return

    for tf_node in token_filters_on_path:
        is_compatible = compatibility_rules.get(tf_node.name)

        if is_compatible is False:
            raise ValueError(f"Le token_filter '{tf_node.name}' est explicitement incompatible avec le tokenizer '{tokenizer_node.name}'.")
        
        # Gère le cas "*" (wildcard)
        wildcard_rule = compatibility_rules.get("*")
        if wildcard_rule == "partial" and is_compatible is not True:
            raise ValueError(f"Le token_filter '{tf_node.name}' n'est pas listé comme compatible avec le tokenizer '{tokenizer_node.name}' (règle 'partial').")
        
        if wildcard_rule is False and is_compatible is not True:
             raise ValueError(f"Le token_filter '{tf_node.name}' n'est pas compatible avec le tokenizer '{tokenizer_node.name}' (règle '*: false').")

