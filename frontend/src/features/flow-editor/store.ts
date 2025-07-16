import { create } from "zustand";
import type { AnalyzerD as AnalyzerGraph, Node as AnalyzerGraphNode, Edge as AnalyzerGraphEdge } from "@/shared/types/analyzer";

/**
 * Store Zustand pour l'édition du graphe d'analyzer.
 * Gère nodes, edges, et expose des actions atomiques.
 */
interface FlowEditorState {
  /** Le graphe courant édité */
  graph: AnalyzerGraph;
  /** Remplace tout le graphe */
  setGraph: (graph: AnalyzerGraph) => void;
  /** Ajoute un nœud (garantit unicité de l’id) */
  addNode: (node: AnalyzerGraphNode) => void;
  /** Met à jour un nœud existant */
  updateNode: (node: AnalyzerGraphNode) => void;
  /** Supprime un nœud + toutes ses arêtes */
  removeNode: (nodeId: string) => void;
  /** Ajoute une arête (garantit unicité de l’id si défini) */
  addEdge: (edge: AnalyzerGraphEdge) => void;
  /** Supprime une arête par id (si id défini) */
  removeEdge: (edgeId: string) => void;
}

export const useFlowEditorStore = create<FlowEditorState>((set, get) => ({
  graph: {
    nodes: [],
    edges: [],
  },

  setGraph: (graph) => set({ graph }),

  addNode: (node) => set((state) => {
    // Vérifie unicité de l’id
    if (state.graph.nodes.some(n => n.id === node.id)) return state;
    return { graph: { ...state.graph, nodes: [...state.graph.nodes, node] } };
  }),

  updateNode: (node) => set((state) => ({
    graph: {
      ...state.graph,
      nodes: state.graph.nodes.map(n => n.id === node.id ? node : n),
    }
  })),

  removeNode: (nodeId) => set((state) => ({
    graph: {
      ...state.graph,
      nodes: state.graph.nodes.filter(n => n.id !== nodeId),
      edges: state.graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    }
  })),

  addEdge: (edge) => set((state) => {
    // Unicité de l’id de l’arête si défini
    if (edge.id && state.graph.edges.some(e => e.id === edge.id)) return state;
    return { graph: { ...state.graph, edges: [...state.graph.edges, edge] } };
  }),

  removeEdge: (edgeId) => set((state) => ({
    graph: {
      ...state.graph,
      edges: state.graph.edges.filter(e => e.id !== edgeId),
    }
  })),
}));
