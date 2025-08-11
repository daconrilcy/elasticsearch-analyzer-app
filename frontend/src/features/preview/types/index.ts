export interface PreviewState {
  status: 'idle' | 'invalid' | 'loading' | 'ready' | 'error';
  errorMessage?: string;
}

export interface ChunkNavigationState {
  currentIndex: number;
  chunkSize: number;
  totalRows: number;
  hasMore: boolean;
}

export interface FilePreviewContextValue {
  file: any | null;
  currentChunk: any | null;
  previewState: PreviewState;
  chunkState: ChunkNavigationState;
  actions: {
    loadChunk: (index: number) => Promise<void>;
    changeChunkSize: (size: number) => void;
    goToPreviousChunk: () => void;
    goToNextChunk: () => void;
    goToChunk: (index: number) => void;
    exportCurrentChunk: () => void;
  };
}

