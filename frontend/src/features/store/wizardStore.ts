import { create } from 'zustand';

// Définition des types pour un typage robuste
type WizardStep = 'upload' | 'mapping' | 'review' | 'ingesting' | 'complete';
type IngestionStatus = 'idle' | 'in_progress' | 'success' | 'error';

// Interface pour l'état du store
interface WizardState {
  step: WizardStep;
  file: File | null;
  dataPreview: any[]; // À typer plus précisément selon le format des données
  schema: any[]; // À typer plus précisément
  mapping: any; // À typer plus précisément
  indexName: string;
  ingestionStatus: IngestionStatus;
  error: string | null;

  // Actions pour mettre à jour l'état
  setStep: (step: WizardStep) => void;
  setFile: (file: File | null) => void;
  setSchema: (schema: any[]) => void;
  setIndexName: (name: string) => void;
  startIngestion: () => void;
  setIngestionSuccess: () => void;
  setIngestionError: (error: string) => void;
  setMapping: (field: string, newConfig: { type: string; analyzer?: string }) => void;
  reset: () => void;

}

// État initial
const initialState = {
  step: 'upload' as WizardStep,
  file: null,
  dataPreview: [],
  schema: [],
  mapping: {},
  indexName: '',
  ingestionStatus: 'idle' as IngestionStatus,
  error: null,
};

// Création du store
export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setFile: (file) => set({ file, error: null }), // Réinitialise l'erreur lors du nouvel upload
  setSchema: (schema) => set({ schema }),
  setIndexName: (name) => set({ indexName: name }),
  startIngestion: () => set({ ingestionStatus: 'in_progress', step: 'ingesting' }),
  setIngestionSuccess: () => set({ ingestionStatus: 'success', step: 'complete' }),
  setIngestionError: (error) => set({ ingestionStatus: 'error', error }),
  reset: () => set(initialState),
  setMapping: (field, newConfig) => {
    set({
        mapping:{
            ...get().mapping,
            [field]: newConfig,
        }
    });
  }
}));