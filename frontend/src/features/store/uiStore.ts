// frontend/src/features/store/uiStore.ts

import { create } from 'zustand';

export interface UIState {
  activePanel: 'nodes' | 'config' | 'results' | '';
  selectedNodeId: string | null;
  setActivePanel: (panel: UIState['activePanel']) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  togglePanel: (panel: 'nodes' | 'config' | 'results') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
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