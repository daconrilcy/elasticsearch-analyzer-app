// frontend/src/features/store/graphStore.ts

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type DefaultEdgeOptions,
} from 'reactflow';
import toast from 'react-hot-toast';
import { Kind, type AnalyzerGraph, type CustomNode, type NodeData } from '@/shared/types/analyzer.d';

// --- Constantes et état initial ---

const initialGraph: AnalyzerGraph = {
  nodes: [
    { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { id: '1', kind: Kind.Input, name: 'Input Text', label: 'Input' } },
    { id: '2', type: 'output', position: { x: 500, y: 100 }, data: { id: '2', kind: Kind.Output, name: 'Output Result', label: 'Output' } },
  ],
  edges: [],
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    type: 'smoothstep',
    // @ts-ignore
    borderRadius: 200,
};

// --- Définition du type pour le store ---

interface GraphState {
  graph: AnalyzerGraph;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: CustomNode) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setGraph: (graph: AnalyzerGraph) => void;
}

// --- Création du store ---

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: initialGraph,

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => ({
      graph: { ...state.graph, nodes: applyNodeChanges(changes, state.graph.nodes) },
    }));
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      graph: { ...state.graph, edges: applyEdgeChanges(changes, state.graph.edges) },
    }));
  },
  
  onConnect: (connection: Connection) => {
    // La logique de validation de connexion est gérée par ReactFlow via `isValidConnection`
    // On se contente d'ajouter l'arête avec les options par défaut.
    const edgeWithOptions = { ...connection, ...defaultEdgeOptions };
    set((state) => ({
      graph: { ...state.graph, edges: addEdge(edgeWithOptions, state.graph.edges) },
    }));
  },

  addNode: (node: CustomNode) => {
    set((state) => ({
      graph: { ...state.graph, nodes: [...state.graph.nodes, node] },
    }));
  },

  deleteNode: (nodeId: string) => {
    const { graph } = get();
    const nodeToDelete = graph.nodes.find(n => n.id === nodeId);

    if (!nodeToDelete) return;

    if (nodeToDelete.data.kind === Kind.Input || nodeToDelete.data.kind === Kind.Output) {
      toast.error("Les nœuds Input et Output ne peuvent pas être supprimés.");
      return;
    }

    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.filter(n => n.id !== nodeId),
        edges: state.graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      },
    }));
    toast.success("Nœud supprimé.");
  },

  updateNodeData: (nodeId: string, newData: Partial<NodeData>) => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((node) => 
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        ),
      },
    }));
  },

  setGraph: (graph: AnalyzerGraph) => {
    set({ graph });
  },
}));