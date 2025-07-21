// frontend/src/features/store/projectStore.ts

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { type AnalyzerGraph, Kind } from '@/shared/types/analyzer.d';
import { useGraphStore } from './graphStore'; // Import for callback
import { useAnalysisStore } from './analysisStore'; // Import for callback

// --- Types ---

export interface ProjectListItem {
  id: number;
  name: string;
}

// Représente la structure complète d'un projet retourné par l'API
export interface FullProject {
  id: number;
  name: string;
  description?: string;
  graph: any; // Le graphe vient en JSON de la BDD
}

interface ProjectState {
  projectList: ProjectListItem[];
  currentProject: { id: number | null; name: string; };
  fetchProjects: () => Promise<void>;
  loadProject: (projectId: number) => Promise<void>;
  saveProject: (graph: AnalyzerGraph) => Promise<void>;
  createNewProject: () => void;
  setCurrentProjectName: (name: string) => void;
  exportCurrentProject: () => Promise<void>;
}

const API_BASE_URL = '/api/v1/projects';

// --- Store ---

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectList: [],
  currentProject: { id: null, name: "Nouveau Projet" },

  fetchProjects: async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Erreur lors de la récupération des projets.');
      const projects: ProjectListItem[] = await response.json();
      set({ projectList: projects });
    } catch (error) {
      toast.error((error as Error).message);
    }
  },
  
  loadProject: async (projectId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement du projet.');
      const project: FullProject = await response.json();

      const rehydratedGraph: AnalyzerGraph = {
          nodes: project.graph.nodes.map((node: any) => ({
              id: node.id,
              type: node.meta?.type || node.kind,
              position: node.meta?.position || { x: 100, y: 100 },
              data: { id: node.id, kind: node.kind, name: node.name, label: node.label, params: node.params },
          })),
          edges: project.graph.edges,
      };
      
      // Utilise les stores importés pour mettre à jour les autres états
      useGraphStore.getState().setGraph(rehydratedGraph);
      useAnalysisStore.getState().resetAnalysis();

      set({ currentProject: { id: project.id, name: project.name } });
      toast.success(`Projet "${project.name}" chargé.`);
    } catch (error) {
        toast.error((error as Error).message);
    }
  },

  saveProject: async (graph: AnalyzerGraph) => {
    const { currentProject } = get();
    const isNew = currentProject.id === null;
    const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${currentProject.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const graphPayload = {
        nodes: graph.nodes.map(node => ({ ...node.data, meta: { position: node.position, type: node.type } })),
        edges: graph.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentProject.name, description: "N/A", graph: graphPayload }),
        });

        if (!response.ok) throw new Error('Erreur lors de la sauvegarde du projet.');
        const savedProject: FullProject = await response.json();

        set({ currentProject: { id: savedProject.id, name: savedProject.name } });
        await get().fetchProjects(); // Rafraîchit la liste
        toast.success('Projet sauvegardé !');
    } catch (error) {
        toast.error((error as Error).message);
    }
  },

  createNewProject: () => {
    // On réinitialise l'état des autres stores via leurs actions
    useGraphStore.getState().setGraph({ nodes: [
        { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { id: '1', kind: Kind.Input, name: 'Input Text', label: 'Input' } },
        { id: '2', type: 'output', position: { x: 500, y: 100 }, data: { id: '2', kind: Kind.Output, name: 'Output Result', label: 'Output' } },
    ], edges: []});
    useAnalysisStore.getState().resetAnalysis();

    set({ currentProject: { id: null, name: "Nouveau Projet" } });
    toast.success("Nouveau projet créé.");
  },
  
  setCurrentProjectName: (name: string) => {
    set(state => ({ currentProject: { ...state.currentProject, name } }));
  },

  exportCurrentProject: async () => {
    const { currentProject } = get();
    if (currentProject.id === null) {
      toast.error("Veuillez d'abord sauvegarder le projet avant de l'exporter.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${currentProject.id}/export`);
      if (!response.ok) throw new Error("Erreur lors de la génération de la configuration.");
      
      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_analyzer.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exportation réussie !");
    } catch (error) {
      toast.error((error as Error).message);
    }
  },
}));