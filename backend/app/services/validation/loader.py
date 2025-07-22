# backend/app/services/validation/loader.py
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

# Singleton pour stocker les définitions chargées en mémoire
_definitions_cache: Dict[str, Any] = {}

class RegistryLoader:
    """
    Charge et fournit l'accès aux définitions des composants Elasticsearch
    (tokenizers, filtres, compatibilité) depuis les fichiers JSON partagés.

    Cette classe utilise un cache en mémoire pour éviter de lire les fichiers
    sur le disque à chaque instanciation.
    """
    def __init__(self):
        if not _definitions_cache:
            self._load_all_definitions()

    def _load_all_definitions(self):
        """Charge tous les fichiers JSON dans le cache."""
        global _definitions_cache
        shared_path = Path(__file__).resolve().parent.parent.parent.parent / "shared-contract" / "registry"
        
        try:
            with open(shared_path / "_es_analyzer_tokenizer.json", encoding="utf-8") as f:
                _definitions_cache["tokenizers"] = {item['name']: item for item in json.load(f)["tokenizers"]}
            
            with open(shared_path / "_es_analyzer_token_filter.json", encoding="utf-8") as f:
                _definitions_cache["token_filters"] = {item['name']: item for item in json.load(f)["token_filters"]}

            with open(shared_path / "_es_analyzer_char_filter.json", encoding="utf-8") as f:
                _definitions_cache["char_filters"] = {item['name']: item for item in json.load(f)["char_filters"]}

            with open(shared_path / "_es_token_filter_compatibility.json", encoding="utf-8") as f:
                _definitions_cache["compatibility"] = {item['tokenizer']: item['token_filters'] for item in json.load(f)["compatibility"]}
        
        except FileNotFoundError as e:
            raise RuntimeError(f"Fichier de définition manquant: {e}") from e
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Erreur de parsing JSON dans un fichier de définition: {e}") from e

    def get_tokenizer(self, name: str) -> Optional[Dict[str, Any]]:
        return _definitions_cache.get("tokenizers", {}).get(name)

    def get_token_filter(self, name: str) -> Optional[Dict[str, Any]]:
        return _definitions_cache.get("token_filters", {}).get(name)

    def get_char_filter(self, name: str) -> Optional[Dict[str, Any]]:
        return _definitions_cache.get("char_filters", {}).get(name)
        
    def get_compatibility_rules(self, tokenizer_name: str) -> Optional[Dict[str, Any]]:
        return _definitions_cache.get("compatibility", {}).get(tokenizer_name)

