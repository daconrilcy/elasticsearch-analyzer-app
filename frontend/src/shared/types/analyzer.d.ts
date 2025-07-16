/**
 * Représentation d’un pipeline d’analyse Elasticsearch au format graphe, avec nodes
 * (tokenizer, char_filter, token_filter, input, output) et arêtes.
 */
export interface AnalyzerD {
    /**
     * Relations entre les nœuds, pour ordonner le pipeline.
     */
    edges: Edge[];
    /**
     * Identifiant unique du graphe (optionnel pour la plupart des usages).
     */
    id?: string;
    /**
     * Nom du projet d’analyzer (pour export/sauvegarde).
     */
    name?: string;
    /**
     * Liste ordonnée de tous les nœuds du pipeline (tokenizer, filters, etc).
     */
    nodes: Node[];
    /**
     * Paramètres globaux du pipeline (optionnel, ex: ES version, langues, options d’analyse).
     */
    settings?: { [key: string]: any };
    /**
     * Version du modèle (optionnel).
     */
    version?: string;
    [property: string]: any;
}

export interface Edge {
    /**
     * ID unique de l’arête (optionnel).
     */
    id?: string;
    /**
     * ID du nœud source.
     */
    source: string;
    /**
     * ID du nœud cible.
     */
    target: string;
    [property: string]: any;
}

export interface Node {
    /**
     * Catégorie du nœud (optionnelle, ex: linguistic, normalization...)
     */
    category?: string;
    /**
     * ID unique du nœud.
     */
    id: string;
    /**
     * Type fonctionnel du nœud.
     */
    kind: Kind;
    /**
     * Label lisible (pour l’UI, optionnel).
     */
    label?: string;
    /**
     * Données de présentation UI (ex: position XY, couleur, icône...)
     */
    meta?: { [key: string]: any };
    /**
     * Nom technique du nœud (ex : lowercase, pattern, stop, html_strip...).
     */
    name: string;
    /**
     * Paramètres spécifiques à ce nœud (optionnel, structure dynamique selon type).
     */
    params?: { [key: string]: any };
    [property: string]: any;
}

/**
 * Type fonctionnel du nœud.
 */
export enum Kind {
    CharFilter = "char_filter",
    Input = "input",
    Output = "output",
    TokenFilter = "token_filter",
    Tokenizer = "tokenizer",
}
