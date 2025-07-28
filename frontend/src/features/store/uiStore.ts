import { create } from 'zustand';

// Ajout du type pour la page active
type Page = 'analyzer' | 'importer';
type Panel = 'nodes' | 'config' | 'results' | '';

export interface UIState {
  // Nouveaux états pour la navigation
  activePage: Page;
  setActivePage: (page: Page) => void;

  // États existants pour la gestion des panneaux
  activePanel: Panel;
  selectedNodeId: string | null;
  setActivePanel: (panel: Panel) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  togglePanel: (panel: 'nodes' | 'config' | 'results') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // --- Nouveaux états ---
  activePage: 'analyzer', // La page par défaut est l'éditeur d'analyseur

  // --- Actions pour les nouveaux états ---
  setActivePage: (page) => set({ activePage: page }),

  // --- États et actions existants (inchangés) ---
  activePanel: 'nodes',
  selectedNodeId: null,

  setActivePanel: (panel) => {
    set({ activePanel: panel });
  },

  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
    if (nodeId) {
      set({ activePanel: 'config' });
    }
  },

  togglePanel: (panel) => {
    const { activePanel } = get();
    set({ activePanel: activePanel === panel ? '' : panel });
  }
}));
