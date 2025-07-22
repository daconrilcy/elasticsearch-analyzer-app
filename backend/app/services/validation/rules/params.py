# backend/app/services/validation/rules/params.py
from app.schemas.analyzer_graph import AnalyzerGraph, Node, Kind
from ..loader import RegistryLoader

def validate_all_node_params(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Itère sur tous les nœuds du graphe et valide leurs paramètres.
    """
    for node in graph.nodes:
        _validate_single_node_params(node, definitions)

def _validate_single_node_params(node: Node, definitions: RegistryLoader):
    """
    Valide les paramètres d'un nœud en fonction de sa définition.
    """
    if node.kind in [Kind.input, Kind.output]:
        return

    # Récupère la définition correspondante au type de nœud
    if node.kind == Kind.tokenizer:
        definition = definitions.get_tokenizer(node.name)
    elif node.kind == Kind.token_filter:
        definition = definitions.get_token_filter(node.name)
    elif node.kind == Kind.char_filter:
        definition = definitions.get_char_filter(node.name)
    else:
        raise ValueError(f"Type de nœud inconnu : {node.kind}")
        
    if not definition:
        raise ValueError(f"Aucune définition trouvée pour {node.kind.value} '{node.name}'.")

    # Si le composant ne requiert aucun paramètre
    if not definition.get("params") or not definition["params"].get("elements"):
        if node.params:
            raise ValueError(f"Le composant '{node.name}' n'accepte aucun paramètre, mais en a reçu.")
        return

    defined_params = {p["name"]: p for p in definition["params"]["elements"]}
    received_params = node.params or {}

    # Vérifier les paramètres inconnus
    for param_name in received_params:
        if param_name not in defined_params:
            raise ValueError(f"Paramètre inconnu '{param_name}' pour le composant '{node.name}'.")

    # Vérifier les paramètres obligatoires
    for param_name, param_def in defined_params.items():
        if param_def.get("mandatory") and param_name not in received_params:
            raise ValueError(f"Paramètre obligatoire '{param_name}' manquant pour le composant '{node.name}'.")
