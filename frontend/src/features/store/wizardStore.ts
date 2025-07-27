import { create } from 'zustand';

type WizardStep = 'createDataset' | 'upload' | 'mapping' | 'review' | 'ingesting' | 'complete';
type IngestionStatus = 'idle' | 'in_progress' | 'success' | 'error';

interface WizardState {
  step: WizardStep;
  
  // Informations sur le jeu de données
  datasetName: string;
  datasetDescription: string;
  datasetId: string | null;

  file: File | null;
  fileId: string | null;
  jobId: string | null;
  schema: any[]; 
  mapping: any; 
  indexName: string;
  ingestionStatus: IngestionStatus;
  error: string | null;

  setStep: (step: WizardStep) => void;
  setDatasetDetails: (details: { name: string; description: string }) => void;
  setDatasetId: (id: string) => void;
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

const initialState = {
  step: 'createDataset' as WizardStep,
  datasetName: '',
  datasetDescription: '',
  datasetId: null,
  file: null,
  fileId: null,
  jobId: null,
  schema: [],
  mapping: {},
  indexName: '',
  ingestionStatus: 'idle' as IngestionStatus,
  error: null,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setDatasetDetails: (details) => set({ datasetName: details.name, datasetDescription: details.description }),
  setDatasetId: (id) => set({ datasetId: id }),
  setFile: (file) => set({ file, error: null, fileId: null }),
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
