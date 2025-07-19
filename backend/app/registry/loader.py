# Fichier: backend/app/registry/loader.py

import json
from pathlib import Path
from typing import Dict, List, Any, Optional

# Construit un chemin d'accès fiable vers le dossier partagé
SHARED_PATH = Path(__file__).resolve().parent.parent.parent.parent / "shared-contract" / "registry"

# "Cache" en mémoire pour éviter de lire les fichiers à chaque requête
_definitions: Dict[str, List[Dict[str, Any]]] = {}

def load_definitions():
    """Charge toutes les définitions de composants (tokenizers, filtres) 
    depuis les fichiers JSON partagés dans le cache en mémoire."""
    global _definitions
    if _definitions:  # Ne charge qu'une seule fois
        return

    try:
        with open(SHARED_PATH / "_es_analyzer_tokenizer.json", encoding="utf-8") as f:
            _definitions["tokenizer"] = json.load(f)["tokenizers"]
        with open(SHARED_PATH / "_es_analyzer_token_filter.json", encoding="utf-8") as f:
            _definitions["token_filter"] = json.load(f)["token_filters"]
        with open(SHARED_PATH / "_es_analyzer_char_filter.json", encoding="utf-8") as f:
            _definitions["char_filter"] = json.load(f)["char_filters"]
    except FileNotFoundError as e:
        # Erreur critique si les fichiers de définition sont manquants
        print(f"ERREUR CRITIQUE: Fichier de définition introuvable. L'application ne peut pas démarrer correctement. {e}")
        raise RuntimeError(f"Fichier de définition manquant: {e}") from e

def get_component_definition(kind: str, name: str) -> Optional[Dict[str, Any]]:
    """
    Récupère la définition complète d'un composant par son type ('kind') et son nom technique.
    Exemple: get_component_definition('token_filter', 'lowercase')
    """
    load_definitions()  # S'assure que les définitions sont chargées
    
    component_list = _definitions.get(kind)
    if not component_list:
        return None
        
    # Recherche le composant par son nom dans la liste correspondante
    return next((item for item in component_list if item.get("name") == name), None)

# Charge les définitions dès l'importation du module pour qu'elles soient prêtes.
load_definitions()