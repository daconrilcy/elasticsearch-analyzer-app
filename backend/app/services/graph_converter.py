from typing import Dict, Tuple, List, Optional
from app.schemas.analyzer_graph import AnalyzerGraph, Kind, Node

# --- Fonctions utilitaires (Helpers) ---

def _build_lookup_maps(graph: AnalyzerGraph) -> Tuple[Dict[str, Node], Dict[str, str]]:
    """
    Prépare des dictionnaires pour un accès rapide et efficace aux nœuds par leur ID
    et aux arêtes par leur ID source.

    Args:
        graph: L'objet AnalyzerGraph contenant les listes de nœuds et d'arêtes.

    Returns:
        Un tuple contenant le dictionnaire des nœuds et le dictionnaire des arêtes.
    """
    node_map = {node.id: node for node in graph.nodes}
    edge_map = {edge.source: edge.target for edge in graph.edges}
    return node_map, edge_map

def _find_start_node(graph: AnalyzerGraph) -> Node:
    """
    Trouve et retourne le nœud de départ ('input') du graphe.
    Lève une exception si aucun nœud 'input' n'est trouvé.

    Args:
        graph: L'objet AnalyzerGraph.

    Returns:
        Le nœud de type 'input'.
    
    Raises:
        ValueError: Si aucun nœud 'input' n'est présent dans le graphe.
    """
    try:
        return next(n for n in graph.nodes if n.kind == Kind.input)
    except StopIteration:
        raise ValueError("Le graphe est invalide : il doit contenir un nœud 'input'.")

# --- Fonction principale ---

def convert_graph_to_es_analyzer(graph: AnalyzerGraph) -> Dict:
    """
    Traverse le graphe de l'interface et le convertit en une définition d'analyseur
    personnalisé que l'API _analyze d'Elasticsearch peut comprendre.

    Args:
        graph: L'objet AnalyzerGraph provenant du frontend.

    Returns:
        Un dictionnaire représentant la configuration de l'analyseur pour Elasticsearch.
    """
    node_map, edge_map = _build_lookup_maps(graph)
    current_node: Optional[Node] = _find_start_node(graph)

    # Initialisation des composants qui formeront l'analyseur
    char_filters: List[str] = []
    tokenizer: Optional[str] = None
    token_filters: List[str] = []
    
    # Dictionnaire pour stocker les définitions de filtres personnalisés (avec paramètres)
    custom_definitions: Dict[str, Dict] = {}

    # On parcourt la chaîne de nœuds, de l'input jusqu'à la fin du chemin
    while current_node:
        target_id = edge_map.get(current_node.id)
        if not target_id:
            break  # Fin du chemin, ce nœud n'a pas de sortie

        next_node = node_map.get(target_id)
        if not next_node:
            # Sécurité : l'arête pointe vers un nœud qui n'existe pas
            break
        
        # --- Traitement du nœud suivant en fonction de son type ('kind') ---
        
        if next_node.kind == Kind.char_filter:
            char_filters.append(next_node.name)
        
        elif next_node.kind == Kind.tokenizer:
            if tokenizer is not None:
                raise ValueError("Le graphe ne peut contenir qu'un seul tokenizer.")
            tokenizer = next_node.name

        elif next_node.kind == Kind.token_filter:
            # Si le nœud a des paramètres personnalisés
            if next_node.params:
                params = next_node.params.copy()

                # --- CORRECTION : Conversion des types ---
                # On s'assure que les paramètres numériques sont bien des entiers.
                # On peut ajouter d'autres conversions ici si nécessaire pour d'autres filtres.
                for key in ["min_gram", "max_gram", "min_shingle_size", "max_shingle_size", "min", "max", "length"]:
                    if key in params and params[key] is not None:
                        try:
                            params[key] = int(params[key])
                        except (ValueError, TypeError):
                            # Gère le cas où la valeur n'est pas un nombre valide
                            raise ValueError(f"Le paramètre '{key}' doit être un nombre entier.")
                # --- FIN DE LA CORRECTION ---

                # 1. On donne un nom unique à notre filtre personnalisé (ex: "stop_custom_1")
                custom_filter_name = f"{next_node.name}_custom_{next_node.id}"
                
                # 2. On crée la définition complète du filtre
                custom_filter_definition = {
                    "type": next_node.name, # Le type de base (ex: "stop")
                    **next_node.params    # Les paramètres (ex: {"stopwords": ["a", "the"]})
                }
                
                # 3. On stocke la définition complète
                custom_definitions[custom_filter_name] = custom_filter_definition
                
                # 4. On ajoute le nom unique à la chaîne des filtres à appliquer
                token_filters.append(custom_filter_name)
            else:
                # Si pas de paramètres, on utilise simplement le nom du filtre prédéfini
                token_filters.append(next_node.name)
        
        # On passe au nœud suivant pour la prochaine itération
        current_node = next_node

    # --- Assemblage final de la définition de l'analyseur ---

    # Si aucun tokenizer n'a été défini, on utilise "standard" par défaut.
    final_tokenizer = tokenizer if tokenizer is not None else "standard"

    # On construit la structure de base de la réponse pour l'API _analyze
    analyzer_definition = {
        "tokenizer": final_tokenizer,
        "char_filter": char_filters,
        "filter": token_filters,
    }

    # On fusionne les définitions de filtres personnalisés dans la réponse finale.
    # La clé (ex: "stop_custom_1") correspondra au nom utilisé dans la liste "filter".
    analyzer_definition.update(custom_definitions)
    
    return analyzer_definition
