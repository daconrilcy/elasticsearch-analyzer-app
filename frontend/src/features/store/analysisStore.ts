// frontend/src/features/store/analysisStore.ts

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { type AnalyzerGraph } from '@/shared/types/analyzer.d';

// --- Types ---

export interface AnalysisStep {
  step_name: string;
  output: string | string[];
}

interface AnalysisPath {
  nodes: string[];
  edges: string[];
}

interface AnalysisState {
  inputText: string;
  analysisSteps: AnalysisStep[];
  analysisPath: AnalysisPath | null;
  isLoading: boolean;
  setInputText: (text: string) => void;
  runAnalysis: (graph: AnalyzerGraph) => Promise<void>;
  resetAnalysis: () => void;
}

// --- Store ---

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  inputText: "The Quick Brown Fox Jumps Over The Lazy Dog",
  analysisSteps: [],
  analysisPath: null,
  isLoading: false,

  setInputText: (text: string) => {
    set({ inputText: text });
  },

  runAnalysis: async (graph: AnalyzerGraph) => {
    set({ isLoading: true, analysisSteps: [], analysisPath: null });
    const { inputText } = get();

    // Nettoyage du graphe pour l'API
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

      const result = await response.json();
      set({ analysisSteps: result.steps, analysisPath: result.path, isLoading: false });
    } catch (error) {
      console.error("Échec de l'analyse:", error);
      toast.error(`Analyse échouée: ${(error as Error).message}`);
      set({ isLoading: false });
    }
  },
  
  resetAnalysis: () => {
    set({ analysisSteps: [], analysisPath: null });
  },
}));