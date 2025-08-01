import { create } from 'zustand';
import toast from 'react-hot-toast';
import { type AnalyzerGraph, Kind } from '@/shared/types/analyzer.d';
import { getAllProjects, getProjectById, saveProject as apiSaveProject } from '@/features/apiClient'; 
import { useGraphStore } from './graphStore';
import { useAnalysisStore } from './analysisStore';
// --- CORRECTION : Import des types depuis le fichier centralisé ---
import type { ProjectListItem, FullProject } from '@/types/api.v1';

// L'interface locale a été supprimée pour éviter les conflits.

interface ProjectState {
  projectList: ProjectListItem[]; // Utilise le type importé
  currentProject: { id: number | null; name: string; };
  fetchProjects: () => Promise<void>;
  loadProject: (projectId: number) => Promise<void>;
  saveProject: (graph: AnalyzerGraph) => Promise<void>;
  createNewProject: () => void;
  setCurrentProjectName: (name: string) => void;
  exportCurrentProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectList: [],
  currentProject: { id: null, name: "Nouveau Projet" },

  fetchProjects: async () => {
    try {
      const projects = await getAllProjects();
      set({ projectList: projects });
    } catch (error) {
      if ((error as Error).message.indexOf('Session expirée') === -1) {
        toast.error((error as Error).message);
      }
    }
  },
  
  loadProject: async (projectId: number) => {
    try {
      const project: FullProject = await getProjectById(projectId); // Utilise le type importé
      const rehydratedGraph: AnalyzerGraph = {
          nodes: project.graph.nodes.map((node: any) => ({
              id: node.id,
              type: node.meta?.type || node.kind,
              position: node.meta?.position || { x: 100, y: 100 },
              data: { id: node.id, kind: node.kind, name: node.name, label: node.label, params: node.params },
          })),
          edges: project.graph.edges,
      };
      
      useGraphStore.getState().setGraph(rehydratedGraph);
      useAnalysisStore.getState().resetAnalysis();

      set({ currentProject: { id: project.id, name: project.name } });
      toast.success(`Projet "${project.name}" chargé.`);
    } catch (error) {
        toast.error((error as Error).message);
    }
  },

  // ... (le reste du fichier reste identique)
  saveProject: async (graph: AnalyzerGraph) => {
    const { currentProject } = get();
    try {
        const savedProject = await apiSaveProject({
            id: currentProject.id,
            name: currentProject.name,
            graph: graph
        });
        set({ currentProject: { id: savedProject.id, name: savedProject.name } });
        await get().fetchProjects();
        toast.success('Projet sauvegardé !');
    } catch (error) {
        toast.error((error as Error).message);
    }
  },

  createNewProject: () => {
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
      const response = await fetch(`/api/v1/projects/${currentProject.id}/export`);
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