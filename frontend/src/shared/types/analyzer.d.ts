import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

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

// Interface pour les données personnalisées dans nos noeuds
export interface NodeData {
    label?: string;
    // Ajoutez ici d'autres champs de données personnalisés si nécessaire
}

// Notre type de Nœud étendu à partir de celui de React Flow
export type CustomNode = ReactFlowNode<NodeData, string | undefined>;


/**
 * Représentation d’un pipeline d’analyse Elasticsearch au format graphe.
 */
export interface AnalyzerD {
    edges: ReactFlowEdge[]; // 👈 Utilise directement le type de React Flow
    id?: string;
    name?: string;
    nodes: CustomNode[]; // 👈 Utilise notre nouveau type personnalisé
    settings?: { [key: string]: any };
    version?: string;
    [property: string]: any;
}import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

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

/**
 * Définit la structure des données personnalisées que nous stockons
 * dans la propriété `data` de chaque nœud React Flow.
 */
export interface NodeData {
    id: string;
    kind: Kind;
    name: string;
    label?: string;
    params?: { [key: string]: any }; 
}

/**
 * Notre type de Nœud complet pour l'application.
 * C'est un nœud React Flow (`ReactFlowNode`) dont la propriété `data`
 * est garantie d'être de type `NodeData`.
 */
export type CustomNode = ReactFlowNode<NodeData>;

/**
 * Représentation du graphe complet de l'analyseur.
 */
export interface AnalyzerD {
    edges: ReactFlowEdge[];
    id?: string;
    name?: string;
    nodes: CustomNode[];
    settings?: { [key: string]: any };
    version?: string;
}