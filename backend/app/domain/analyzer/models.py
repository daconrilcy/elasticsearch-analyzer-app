""" backend/app/domain/analyzer/models.py """
# generated by datamodel-codegen:
#   filename:  analyzer.schema.json
#   timestamp: 2025-07-16T10:23:11+00:00

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class Kind(Enum):
    """Type de nœud."""
    input = 'input'
    tokenizer = 'tokenizer'
    char_filter = 'char_filter'
    token_filter = 'token_filter'
    output = 'output'


class Node(BaseModel):
    id: str = Field(..., description='ID unique du nœud.')
    kind: Kind = Field(..., description='Type fonctionnel du nœud.')
    name: str = Field(
        ...,
        description='Nom technique du nœud (ex : lowercase, pattern, stop, html_strip...).',
    )
    label: Optional[str] = Field(
        None, description='Label lisible (pour l’UI, optionnel).'
    )
    category: Optional[str] = Field(
        None,
        description='Catégorie du nœud (optionnelle, ex: linguistic, normalization...)',
    )
    params: Optional[Dict[str, Any]] = Field(
        None,
        description='Paramètres spécifiques à ce nœud (optionnel, structure dynamique selon type).',
    )
    meta: Optional[Dict[str, Any]] = Field(
        None,
        description='Données de présentation UI (ex: position XY, couleur, icône...)',
    )

    model_config = ConfigDict()


class Edge(BaseModel):
    id: Optional[str] = Field(None, description='ID unique de l’arête (optionnel).')
    source: str = Field(..., description='ID du nœud source.')
    target: str = Field(..., description='ID du nœud cible.')

    model_config = ConfigDict()


class AnalyzerGraph(BaseModel):
    id: Optional[str] = Field(
        None,
        description='Identifiant unique du graphe (optionnel pour la plupart des usages).',
    )
    name: Optional[str] = Field(
        None, description='Nom du projet d’analyzer (pour export/sauvegarde).'
    )
    version: Optional[str] = Field(None, description='Version du modèle (optionnel).')
    nodes: List[Node] = Field(
        ...,
        description='Liste ordonnée de tous les nœuds du pipeline (tokenizer, filters, etc).',
    )
    edges: List[Edge] = Field(
        ..., description='Relations entre les nœuds, pour ordonner le pipeline.'
    )
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description='Paramètres globaux du pipeline (optionnel, ex: ES version, langues, options d’analyse).',
    )

    model_config = ConfigDict()
