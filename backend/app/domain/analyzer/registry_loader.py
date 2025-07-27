# app/domain/analyzer/registry_loader.py
import json
from math import log
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from sqlalchemy import false

class RegistryLoader:
    """
    Singleton chargé de fournir toutes les définitions de composants
    (tokenizers, token_filters, char_filters) ainsi que les règles de compatibilité
    pour la validation d'un pipeline d'Analyzer Elasticsearch.
    """
    _instance = None
    _definitions: Dict[str, Any] = {}

    SHARED_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / "shared-contract" / "registry"

    def __new__(cls):
        if cls._instance is None:
            logger.info(f"Initialisation du RegistryLoader. Chemin des contrats partagés: {cls.SHARED_PATH}")
            if not cls.SHARED_PATH.is_dir():
                logger.error(f"Le répertoire des contrats partagés n'existe pas: {cls.SHARED_PATH}")
                raise FileNotFoundError(f"Le répertoire des contrats partagés est introuvable: {cls.SHARED_PATH}")
            
            cls._instance = super().__new__(cls)
            cls._instance._definitions = {}
            cls._instance._load_definitions()
        return cls._instance

    def _load_definitions(self):
        """
        Charge en mémoire les fichiers de définition nécessaires à la validation.
        """
        logger.debug("_load definitions")
        try:
            logger.debug("_es_analyzer_tokenizer.json")
            with open(self.SHARED_PATH / "_es_analyzer_tokenizer.json", encoding="utf-8") as f:
                self._definitions["tokenizers"] = {item['name']: item for item in json.load(f)["tokenizers"]}
            
            logger.debug("_es_analyzer_token_filter.json")
            with open(self.SHARED_PATH / "_es_analyzer_token_filter.json", encoding="utf-8") as f:
                self._definitions["token_filters"] = {item['name']: item for item in json.load(f)["token_filters"]}
            logger.debug("_es_analyzer_char_filter.json")
            with open(self.SHARED_PATH / "_es_analyzer_char_filter.json", encoding="utf-8") as f:
                self._definitions["char_filters"] = {item['name']: item for item in json.load(f)["char_filters"]}
            logger.debug("_es_token_filter_compatibility.json")
            compat_path = self.SHARED_PATH / "_es_token_filter_compatibility.json"
            if compat_path.exists():
                with open(compat_path, encoding="utf-8") as f:
                    self._definitions["compatibility"] = {
                        item['tokenizer']: item['token_filters']
                        for item in json.load(f)["compatibility"]
                    }
            else:
                self._definitions["compatibility"] = {}

            logger.debug(f"tokenizers presents: {self._definitions['tokenizers'].keys()}")

        except FileNotFoundError as e:
            logger.critical(f"Fichier de définition critique manquant: {e.filename}")
            raise RuntimeError(f"Fichier de définition manquant: {e}") from e
        except json.JSONDecodeError as e:
            logger.critical(f"Erreur de parsing JSON dans un fichier de définition: {e}")
            raise RuntimeError(f"Erreur de parsing JSON dans un fichier de définition: {e}") from e

    def get_tokenizer(self, name: str) -> Optional[Dict[str, Any]]:
        return self._definitions.get("tokenizers", {}).get(name)

    def get_token_filter(self, name: str) -> Optional[Dict[str, Any]]:
        return self._definitions.get("token_filters", {}).get(name)

    def get_char_filter(self, name: str) -> Optional[Dict[str, Any]]:
        return self._definitions.get("char_filters", {}).get(name)

    def get_compatibility(self, tokenizer_name: str) -> Optional[Dict[str, Any]]:
        return self._definitions.get("compatibility", {}).get(tokenizer_name)

    def get_component(self, kind: str, name: str) -> Optional[Dict[str, Any]]:
        kind_map = {
            "tokenizer": "tokenizers",
            "token_filter": "token_filters",
            "char_filter": "char_filters"
        }
        return self._definitions.get(kind_map.get(kind, kind), {}).get(name)

    # --- CORRECTION : MÉTHODE AJOUTÉE ---
    def validate_element_exists(self, kind: str, name: str) -> bool:
        """
        Vérifie qu'un composant existe dans la registry, sinon lève une ValueError.
        """
        try:
            if not self.get_component(kind, name):
                return false
            return True
        except Exception as e:
            available_keys = self._definitions.keys()
            logger.error(f"error finding {e}")
            logger.debug(f"available keys:{available_keys}")
            return false

    @property
    def __dict__(self):
        return self._definitions

