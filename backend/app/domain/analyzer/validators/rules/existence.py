""" backend/app/services/validation/rules/existence.py """
from app.domain.analyzer.models import AnalyzerGraph, Kind
from app.domain.analyzer.registry_loader import RegistryLoader
from loguru import logger


def validate_all_elements_exist(graph: AnalyzerGraph, definitions: RegistryLoader):
    """
    Valide que chaque nœud du pipeline (hors input/output) existe dans la registry.
    Cette règle doit être exécutée AVANT toute validation fonctionnelle.
    """
    for node in graph.nodes:
        logger.debug(f"node : {node}")
        if node.kind in [Kind.input, Kind.output]:
            continue
        if not definitions.validate_element_exists(node.kind.value, node.name):
            logger.error(f"L'élément '{node.name}' de type '{node.kind.value}' n'existe pas dans la registry.")
            raise ValueError(
                f"L'élément '{node.name}' de type '{node.kind.value}' n'existe pas dans la registry."
            )
