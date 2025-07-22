# backend/app/services/validation/validator.py
from app.schemas.analyzer_graph import AnalyzerGraph
from .loader import RegistryLoader
from .registry import VALIDATION_RULES

class ValidationError(ValueError):
    """Exception personnalisée pour les erreurs de validation du graphe."""
    pass

def validate_full_graph(graph: AnalyzerGraph):
    """
    Orchestre l'exécution de toutes les règles de validation sur le graphe.

    Cette fonction charge les définitions des composants (tokenizers, filtres, etc.)
    et exécute séquentiellement chaque règle de validation définie dans le registre.
    Si une règle échoue, une ValidationError est levée.

    Args:
        graph: L'objet AnalyzerGraph à valider.

    Raises:
        ValidationError: Si une des règles de validation n'est pas respectée.
    """
    try:
        # 1. Charger toutes les définitions et les règles de compatibilité
        definitions = RegistryLoader()

        # 2. Exécuter chaque règle enregistrée
        for rule_func in VALIDATION_RULES:
            rule_func(graph, definitions)

    except ValueError as e:
        # 3. Capter les erreurs de validation et les encapsuler
        # pour une gestion d'erreur uniforme dans l'API.
        raise ValidationError(str(e)) from e