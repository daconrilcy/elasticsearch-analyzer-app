// frontend/src/shared/types/analyzer.d.ts

import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

export type { ReactFlowEdge };

/**
 * Type fonctionnel du nœud, partagé entre le front et le back.
 */
export enum Kind {
  CharFilter = "char_filter",
  Input = "input",
  Output = "output",
  TokenFilter = "token_filter",
  Tokenizer = "tokenizer",
}

/**
 * Représentation d’un pipeline d’analyse Elasticsearch au format graphe.
 */
export interface AnalyzerD {
    edges: ReactFlowEdge[]; 
    id?: string;
    name?: string;
    nodes: CustomNode[]; 
    settings?: { [key: string]: any };
    version?: string;
    [property: string]: any;
}

/**
 * Données spécifiques à un nœud de notre application,
 * stockées dans la propriété `data` de chaque nœud React Flow.
 */
export interface NodeData {
  id: string;
  kind: Kind;
  name: string;      // Nom technique (ex: "lowercase")
  label?: string;    // Label affiché, modifiable par l'utilisateur
  params?: { [key: string]: any };
}

/**
 * Type d'un nœud personnalisé dans notre application.
 * Il hérite de ReactFlowNode et garantit que `data` est de type `NodeData`.
 */
export type CustomNode = ReactFlowNode<NodeData>;

/**
 * Représentation complète du graphe de l'analyseur.
 * C'est la structure principale échangée avec le backend.
 */
export interface AnalyzerGraph {
  nodes: CustomNode[];
  edges: ReactFlowEdge[];
  id?: string;
  name?: string;
  settings?: { [key: string]: any };
  version?: string;
}

