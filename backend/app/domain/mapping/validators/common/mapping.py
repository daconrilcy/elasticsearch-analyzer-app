"""
Module pour exposer le schéma JSON du DSL Mapping.
"""

import json
import os
from pathlib import Path

def get_schema() -> dict:
    """
    Récupère le schéma JSON du DSL Mapping.
    
    Returns:
        dict: Le schéma JSON complet
    """
    # Chemin vers le fichier schema.json
    schema_path = Path(__file__).parent / "mapping.schema.json"
    
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        # Fallback: schéma minimal en cas d'erreur
        return {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://ton-org/mapping-dsl/2-2.schema.json",
            "title": "Elasticsearch Mapping DSL Schema V2.2",
            "description": "Schéma V2.2 pour la validation du DSL de mapping",
            "type": "object",
            "error": f"Impossible de charger le schéma: {e}"
        }

def get_schema_version() -> str:
    """
    Récupère la version du schéma.
    
    Returns:
        str: Version du schéma (ex: "2.2")
    """
    schema = get_schema()
    return schema.get("$id", "").split("/")[-1].replace(".schema.json", "")

def get_schema_info() -> dict:
    """
    Récupère les informations de base du schéma.
    
    Returns:
        dict: Informations du schéma (version, titre, description)
    """
    schema = get_schema()
    return {
        "version": get_schema_version(),
        "title": schema.get("title", ""),
        "description": schema.get("description", ""),
        "required_fields": schema.get("required", []),
        "properties_count": len(schema.get("properties", {})),
        "definitions_count": len(schema.get("$defs", {}))
    }
