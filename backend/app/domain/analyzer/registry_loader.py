# backend/app/registry/registry_loader.py

import json
from pathlib import Path
from typing import Dict, Any, Optional


class RegistryLoader:
    """
    Singleton chargé de fournir toutes les définitions de composants
    (tokenizers, token_filters, char_filters) ainsi que les règles de compatibilité
    pour la validation d'un pipeline d'Analyzer Elasticsearch.
    """
    _instance = None
    _definitions: Dict[str, Any] = None

    # Chemin vers le dossier contenant tous les fichiers de définition JSON partagés
    SHARED_PATH = Path(__file__).resolve().parent.parent.parent.parent / "shared-contract" / "registry"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._definitions = {}
            cls._instance._load_definitions()
        return cls._instance

    def _load_definitions(self):
        """
        Charge en mémoire les fichiers de définition nécessaires à la validation
        (tokenizers, token_filters, char_filters, compatibilité...).
        """
        try:
            with open(self.SHARED_PATH / "_es_analyzer_tokenizer.json", encoding="utf-8") as f:
                self._definitions["tokenizers"] = {item['name']: item for item in json.load(f)["tokenizers"]}

            with open(self.SHARED_PATH / "_es_analyzer_token_filter.json", encoding="utf-8") as f:
                self._definitions["token_filters"] = {item['name']: item for item in json.load(f)["token_filters"]}

            with open(self.SHARED_PATH / "_es_analyzer_char_filter.json", encoding="utf-8") as f:
                self._definitions["char_filters"] = {item['name']: item for item in json.load(f)["char_filters"]}

            # Chargement des règles de compatibilité entre tokenizers et token_filters
            compat_path = self.SHARED_PATH / "_es_token_filter_compatibility.json"
            if compat_path.exists():
                with open(compat_path, encoding="utf-8") as f:
                    self._definitions["compatibility"] = {
                        item['tokenizer']: item['token_filters']
                        for item in json.load(f)["compatibility"]
                    }
            else:
                self._definitions["compatibility"] = {}

        except FileNotFoundError as e:
            raise RuntimeError(f"Fichier de définition manquant: {e}") from e
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Erreur de parsing JSON dans un fichier de définition: {e}") from e

    def get_tokenizer(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Récupère la définition d'un tokenizer par son nom.
        """
        return self._definitions.get("tokenizers", {}).get(name)

    def get_token_filter(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Récupère la définition d'un token_filter par son nom.
        """
        return self._definitions.get("token_filters", {}).get(name)

    def get_char_filter(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Récupère la définition d'un char_filter par son nom.
        """
        return self._definitions.get("char_filters", {}).get(name)

    def get_compatibility(self, tokenizer_name: str) -> Optional[Dict[str, Any]]:
        """
        Récupère les règles de compatibilité associées à un tokenizer donné.
        """
        return self._definitions.get("compatibility", {}).get(tokenizer_name)

    def get_component(self, kind: str, name: str) -> Optional[Dict[str, Any]]:
        """
        Récupère la définition d'un composant par son type (kind) et son nom.
        Les types valides sont 'tokenizer', 'token_filter', 'char_filter'.
        """
        kind_map = {
            "tokenizer": "tokenizers",
            "token_filter": "token_filters",
            "char_filter": "char_filters"
        }
        return self._definitions.get(kind_map.get(kind, kind), {}).get(name)

    def validate_element_exists(self, kind: str, name: str):
        """
        Vérifie l'existence d'un composant de type donné dans la registry.
        Lève une ValueError si le composant n'est pas trouvé.
        """
        if not self.get_component(kind, name):
            raise ValueError(f"L'élément '{name}' de type '{kind}' n'existe pas dans la registry.")
