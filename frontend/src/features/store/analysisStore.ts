// src/features/store/analysisStore.ts
import { create } from 'zustand';
import toast from 'react-hot-toast';
import { type AnalyzerGraph } from '@/shared/types/analyzer.d';
import { validateGraph } from '@/services/graphValidationService';

export interface AnalysisStep {
  step_name: string;
  output: string | string[];
}

// L'interface AnalysisPath n'est plus nécessaire car la validation du chemin
// se fait maintenant côté client avant l'appel API.
// interface AnalysisPath { ... }

interface AnalysisState {
  inputText: string;
  analysisSteps: AnalysisStep[];
  validationIssues: string[];
  isLoading: boolean;
  setInputText: (text: string) => void;
  runAnalysis: (graph: AnalyzerGraph) => Promise<void>;
  resetAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  inputText: "The Quick Brown Fox Jumps Over The Lazy Dog",
  analysisSteps: [],
  validationIssues: [],
  isLoading: false,

  setInputText: (text: string) => {
    set({ inputText: text });
  },

  runAnalysis: async (graph: AnalyzerGraph) => {
    // 1. Valider le graphe côté client d'abord.
    const issues = validateGraph(graph);
    if (issues.length > 0) {
      // S'il y a des problèmes, on les affiche et on n'appelle pas l'API.
      set({ validationIssues: issues, analysisSteps: [], isLoading: false });
      return;
    }

    // 2. Si le graphe est valide, on procède à l'appel API.
    set({ isLoading: true, validationIssues: [] });
    const { inputText } = get();

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
        throw new Error(errorData.detail || 'Erreur du serveur d\'analyse.');
      }

      // La réponse du backend ne contient plus que les étapes, car le chemin est déjà validé.
      const result = await response.json();
      set({ analysisSteps: result.steps, isLoading: false });
    } catch (error) {
      console.error("Échec de l'analyse:", error);
      toast.error(`Analyse échouée: ${(error as Error).message}`);
      set({ isLoading: false });
    }
  },
  
  resetAnalysis: () => {
    set({ analysisSteps: [], validationIssues: [] });
  },
}));
