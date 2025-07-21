import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type DefaultEdgeOptions, // NOUVEL IMPORT
} from 'reactflow';
import toast from 'react-hot-toast';

import { Kind, type AnalyzerD, type CustomNode, type NodeData } from '../../shared/types/analyzer.d';

// --- Définition des Types ---
interface ProjectListItem { id: number; name: string; }
export interface AnalysisStep { step_name: string; output: string | string[]; }
interface AnalysisPath { nodes: string[]; edges: string[]; }

export interface FlowEditorState {
  graph: AnalyzerD;
  inputText: string;
  analysisSteps: AnalysisStep[];
  analysisPath: AnalysisPath | null;
  isLoading: boolean;
  selectedNode: CustomNode | null;
  projectList: ProjectListItem[];
  currentProject: { id: number | null; name: string; };
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: CustomNode) => void;
  deleteNode: (nodeId: string) => void;
  setInputText: (text: string) => void;
  analyze: () => Promise<void>;
  setSelectedNode: (node: CustomNode | null) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  fetchProjects: () => Promise<void>;
  loadProject: (projectId: number) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  createNewProject: () => void;
  setCurrentProjectName: (name: string) => void;
  exportCurrentProject: () => Promise<void>;
}

// --- Logique de validation & État Initial ---
const NODE_ORDER: Record<string, number> = {
  [Kind.Input]: 0,
  [Kind.CharFilter]: 1,
  [Kind.Tokenizer]: 2,
  [Kind.TokenFilter]: 3,
  [Kind.Output]: 4,
};

// NOUVEAU : Définir les options par défaut pour les arêtes
const defaultEdgeOptions: DefaultEdgeOptions = {
    type: 'smoothstep',
    // @ts-ignore - 'borderRadius' est une prop valide pour 'smoothstep'
    borderRadius: 200,
};

function isValidConnection(sourceNode: CustomNode, targetNode: CustomNode): boolean {
  const sourceOrder = NODE_ORDER[sourceNode.data.kind];
  const targetOrder = NODE_ORDER[targetNode.data.kind];
  return targetOrder >= sourceOrder;
}

const initialGraph: AnalyzerD = {
  nodes: [
    { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { id: '1', kind: Kind.Input, name: 'Input Text', label: 'Input' } },
    { id: '2', type: 'output', position: { x: 500, y: 100 }, data: { id: '2', kind: Kind.Output, name: 'Output Result', label: 'Output' } },
  ],
  edges: [],
};

export const useFlowEditorStore = create<FlowEditorState>((set, get) => ({
  // --- Initialisation de l'état ---
  graph: initialGraph,
  inputText: "The Quick Brown Fox Jumps Over The Lazy Dog",
  analysisSteps: [],
  analysisPath: null,
  isLoading: false,
  selectedNode: null,
  projectList: [],
  currentProject: { id: null, name: "Nouveau Projet" },

  // --- Actions ---
  onNodesChange: (changes) => set(state => ({ graph: { ...state.graph, nodes: applyNodeChanges(changes, state.graph.nodes) } })),
  onEdgesChange: (changes) => set(state => ({ graph: { ...state.graph, edges: applyEdgeChanges(changes, state.graph.edges) } })),
  
  // CORRECTION : La logique est maintenant centralisée ici
  onConnect: (connection) => {
    const { graph } = get();
    const sourceNode = graph.nodes.find(node => node.id === connection.source) as CustomNode;
    const targetNode = graph.nodes.find(node => node.id === connection.target) as CustomNode;
    
    if (sourceNode && targetNode && isValidConnection(sourceNode, targetNode)) {
      // Fusionne les options par défaut avec la nouvelle connexion
      const edgeWithOptions = { ...connection, ...defaultEdgeOptions };
      set(state => ({ 
        graph: { ...state.graph, edges: addEdge(edgeWithOptions, state.graph.edges) } 
      }));
    } else if (sourceNode && targetNode) {
      toast.error(`Connexion invalide : un '${sourceNode.data.kind}' ne peut pas précéder un '${targetNode.data.kind}'.`);
    }
  },

  addNode: (node) => set(state => ({ graph: { ...state.graph, nodes: [...state.graph.nodes, node] } })),
  setInputText: (text) => set({ inputText: text }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  updateNodeData: (nodeId, newData) => {
    set(state => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        }),
      },
      selectedNode: state.selectedNode?.id === nodeId 
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...newData } }
        : state.selectedNode,
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
    set(state => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.filter(node => node.id !== nodeId),
        edges: state.graph.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      },
      selectedNode: null,
    }));
    toast.success("Nœud supprimé.");
  },

  analyze: async () => {
    set({ isLoading: true, analysisSteps: [], analysisPath: null });
    const { graph, inputText } = get();
    const cleanedGraph = {
      nodes: graph.nodes.map(n => ({...n.data, meta: { position: n.position, type: n.type }})),
      edges: graph.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    };
    try {
      const response = await fetch('/api/v1/analyzer/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, graph: cleanedGraph }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Une erreur est survenue lors de l\'analyse.');
      }
      const result = await response.json();
      set({ analysisSteps: result.steps, analysisPath: result.path, isLoading: false });
    } catch (error) {
      console.error("Échec de l'analyse:", error);
      if (error instanceof Error) toast.error(`Échec de l'analyse: ${error.message}`);
      set({ isLoading: false }); 
    }
  },

  // --- Gestion des projets ---
  setCurrentProjectName: (name) => set(state => ({ currentProject: { ...state.currentProject, name } })),
  createNewProject: () => {
    set({ graph: initialGraph, currentProject: { id: null, name: "Nouveau Projet" }, selectedNode: null, analysisPath: null, analysisSteps: [] });
    toast.success("Nouveau projet créé.");
  },
  fetchProjects: async () => {
    try {
      const response = await fetch('/api/v1/projects');
      if (!response.ok) throw new Error('Erreur lors de la récupération des projets.');
      const projects: ProjectListItem[] = await response.json();
      set({ projectList: projects });
    } catch (error) {
      console.error("Échec de la récupération des projets:", error);
      if (error instanceof Error) toast.error(error.message);
    }
  },
  loadProject: async (projectId: number) => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement du projet.');
      const project = await response.json();
      const rehydratedGraph: AnalyzerD = {
        nodes: project.graph.nodes.map((node: any) => ({
          id: node.id,
          type: node.meta?.type || node.kind,
          position: node.meta?.position || { x: Math.random() * 400, y: Math.random() * 400 },
          data: { id: node.id, kind: node.kind, name: node.name, label: node.label, params: node.params },
        })),
        edges: project.graph.edges,
      };
      set({ graph: rehydratedGraph, currentProject: { id: project.id, name: project.name }, selectedNode: null, analysisPath: null, analysisSteps: [] });
      toast.success(`Projet "${project.name}" chargé.`);
    } catch (error) {
      console.error("Échec du chargement du projet:", error);
      if (error instanceof Error) toast.error(error.message);
    }
  },
  saveCurrentProject: async () => {
    const { currentProject, graph } = get();
    const isNewProject = currentProject.id === null;
    const url = isNewProject ? '/api/v1/projects' : `/api/v1/projects/${currentProject.id}`;
    const method = isNewProject ? 'POST' : 'PUT';
    const cleanedGraph = {
      nodes: graph.nodes.map(node => ({ ...node.data, meta: { position: node.position, type: node.type } })),
      edges: graph.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    };
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentProject.name, description: "Description à ajouter plus tard", graph: cleanedGraph }),
      });
      if (!response.ok) throw new Error('Erreur lors de la sauvegarde du projet.');
      const savedProject = await response.json();
      set({ currentProject: { id: savedProject.id, name: savedProject.name } });
      get().fetchProjects();
      toast.success('Projet sauvegardé avec succès !');
    } catch (error) {
      console.error("Échec de la sauvegarde:", error);
      toast.error('Une erreur est survenue lors de la sauvegarde.');
    }
  },
  exportCurrentProject: async () => {
    const { currentProject } = get();
    if (currentProject.id === null) {
      toast.error("Veuillez d'abord sauvegarder le projet avant de l'exporter.");
      return;
    }
    try {
      const response = await fetch(`/api/v1/projects/${currentProject.id}/export`);
      if (!response.ok) throw new Error("Erreur lors de la génération de la configuration d'export.");
      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentProject.name.toLowerCase().replace(' ', '_')}_analyzer.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exportation réussie !");
    } catch (error) {
      console.error("Échec de l'export:", error);
      toast.error("Une erreur est survenue lors de l'exportation.");
    }
  },
}));
