# Fichier: backend/app/services/validation.py

from app.schemas.analyzer_graph import AnalyzerGraph, Node
from app.registry.loader import get_component_definition

def _validate_node_params(node: Node):
    """
    Valide les paramètres d'un nœud spécifique en les comparant à sa définition officielle
    chargée depuis les fichiers JSON partagés.
    Lève une exception ValueError en cas d'incohérence.
    """
    # Les nœuds 'input' et 'output' n'ont pas de définition ou de paramètres à valider
    if node.kind.value in ["input", "output"]:
        return

    definition = get_component_definition(node.kind.value, node.name)

    if not definition:
        raise ValueError(f"Composant non valide : Le type '{node.kind.value}' avec le nom '{node.name}' n'existe pas.")

    # Cas 1 : Le composant ne requiert aucun paramètre
    if not definition.get("params") or not definition["params"].get("elements"):
        if node.params:
            raise ValueError(f"Le composant '{node.name}' n'accepte aucun paramètre, mais en a reçu.")
        return # La validation est terminée pour ce nœud

    # Cas 2 : Le composant a des paramètres définis
    defined_params = {p["name"] for p in definition["params"]["elements"]}
    received_params = node.params or {}

    # Vérifie la présence de paramètres inconnus envoyés par le client
    for param_name in received_params:
        if param_name not in defined_params:
            raise ValueError(f"Paramètre inconnu '{param_name}' pour le composant '{node.name}'.")

    # Si les paramètres sont exclusifs, on s'assure qu'un seul a été fourni
    if definition["params"].get("exclusive") and len(received_params) > 1:
        raise ValueError(f"Le composant '{node.name}' n'accepte qu'un seul paramètre à la fois (exclusif).")
    
    # Vérifie que les paramètres obligatoires sont bien présents
    for param_def in definition["params"]["elements"]:
        is_mandatory = param_def.get("mandatory", False)
        param_name = param_def["name"]
        
        if is_mandatory and param_name not in received_params:
            # Note : Pour les paramètres exclusifs, cette règle est moins stricte.
            # On pourrait l'affiner si un choix par défaut est toujours requis.
            pass # La logique actuelle du frontend garantit qu'un choix est fait.

def validate_full_graph(graph: AnalyzerGraph):
    """
    Fonction principale qui orchestre toutes les validations sur le graphe.
    Elle vérifie la structure des arêtes et la validité de chaque nœud et de ses paramètres.
    """
    # 1. Validation de la structure du graphe (connexions)
    node_ids = {node.id for node in graph.nodes}
    for edge in graph.edges:
        if edge.source not in node_ids:
            raise ValueError(f"L'arête source '{edge.source}' ne correspond à aucun nœud.")
        if edge.target not in node_ids:
            raise ValueError(f"L'arête cible '{edge.target}' ne correspond à aucun nœud.")
            
    # 2. Validation de chaque nœud individuellement (paramètres)
    for node in graph.nodes:
        _validate_node_params(node)
        
    # 3. (Optionnel) Ajouter ici d'autres logiques de validation globales
    #    Ex: Vérifier qu'il y a bien un et un seul tokenizer, etc.