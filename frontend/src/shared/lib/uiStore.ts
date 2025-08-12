import { create } from 'zustand';

// CORRECTION : Les types 'Page' sont retirés car la navigation est gérée par le routeur.
type Panel = 'nodes' | 'config' | 'results' | '';

export interface UIState {
  // Les états pour la gestion des panneaux sont conservés
  activePanel: Panel;
  selectedNodeId: string | null;
  setActivePanel: (panel: Panel) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  togglePanel: (panel: 'nodes' | 'config' | 'results') => void;
  resetUI: () => void; // Nouvelle fonction pour réinitialiser
}

export const useUIStore = create<UIState>((set, get) => ({
  // États et actions pour les panneaux (inchangés)
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
  },

  resetUI: () => {
    set({ activePanel: 'nodes', selectedNodeId: null });
  }
}));