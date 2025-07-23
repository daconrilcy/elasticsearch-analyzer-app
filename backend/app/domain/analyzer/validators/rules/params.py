# backend/app/services/validation/rules/params.py
from backend.app.domain.analyzer.models import AnalyzerGraph, Kind
from backend.app.domain.analyzer.registry_loader import RegistryLoader

def validate_all_node_params(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide les paramètres de chaque nœud du graphe à partir de la registry.
    """
    for node in graph.nodes:
        if node.kind in [Kind.input, Kind.output]:
            continue

        definition = definitions.get_component(node.kind.value, node.name)
        if not definition:
            raise ValueError(f"Aucune définition trouvée pour {node.kind.value} '{node.name}'.")

        # Si le composant ne requiert aucun paramètre
        if not definition.get("params") or not definition["params"].get("elements"):
            if node.params:
                raise ValueError(f"Le composant '{node.name}' n'accepte aucun paramètre, mais en a reçu.")
            continue

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
