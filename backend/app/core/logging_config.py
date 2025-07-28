"""app/core/logging_config.py"""
import sys
from loguru import logger


def setup_logging():
    """
    Configure Loguru pour un logging structuré et performant.

    Cette configuration de base est optimisée pour le développement (logs colorisés et lisibles)
    et peut-être facilement adaptée pour la production (logs au format JSON).
    """
    # On retire le handler par défaut pour avoir un contrôle total
    logger.remove()

    # Ajout d'un handler pour la console avec un format lisible et des couleurs
    logger.add(
        sys.stdout,
        level="DEBUG",  # Niveau de log minimum à afficher dans la console
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
    )

    # --- Pour la Production ---
    # Décommentez cette section pour activer le logging au format JSON dans un fichier.
    # C'est idéal pour l'intégration avec des outils comme Datadog, Splunk, ou la stack ELK.
    # logger.add(
    #     "logs/app.log",      # Chemin du fichier de log
    #     level="INFO",
    #     format="{message}",    # Format de base, Loguru s'occupe du reste
    #     serialize=True,      # C'est la clé pour un output JSON !
    #     rotation="100 MB",   # Rotation des fichiers de log
    #     retention="10 days", # Conservation des anciens fichiers
    #     catch=True,          # Capture les exceptions non gérées
    # )

    logger.info("Configuration du logging terminée.")

