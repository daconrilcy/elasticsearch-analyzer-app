import { create } from 'zustand';

// Définition des types pour un typage robuste
type WizardStep = 'upload' | 'mapping' | 'review' | 'ingesting' | 'complete';
type IngestionStatus = 'idle' | 'in_progress' | 'success' | 'error';

// Interface pour l'état du store
interface WizardState {
  step: WizardStep;
  file: File | null;
  fileId: string | null; // ID du fichier après upload
  jobId: string | null; // ID du job d'ingestion
  dataPreview: any[]; 
  schema: any[]; 
  mapping: any; 
  indexName: string;
  ingestionStatus: IngestionStatus;
  error: string | null;

  // Actions pour mettre à jour l'état
  setStep: (step: WizardStep) => void;
  setFile: (file: File | null) => void;
  setUploadedFile: (fileId: string) => void;
  setSchema: (schema: any[]) => void;
  setIndexName: (name: string) => void;
  startIngestion: (jobId: string) => void;
  setIngestionSuccess: () => void;
  setIngestionError: (error: string) => void;
  setMapping: (field: string, newConfig: { type: string; analyzer?: string }) => void;
  reset: () => void;
}

// État initial
const initialState = {
  step: 'upload' as WizardStep,
  file: null,
  fileId: null,
  jobId: null,
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
  setFile: (file) => set({ file, error: null, fileId: null }), // Réinitialise l'erreur et fileId
  setUploadedFile: (fileId) => set({ fileId }),
  setSchema: (schema) => set({ schema }),
  setIndexName: (name) => set({ indexName: name }),
  startIngestion: (jobId) => set({ ingestionStatus: 'in_progress', step: 'ingesting', jobId }),
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
