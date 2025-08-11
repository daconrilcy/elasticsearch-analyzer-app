export type UUID = string;

export type FileStatus = 'pending' | 'parsing' | 'ready' | 'error';

export type IngestionStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface FileOut {
  id: UUID;
  filename_original: string;
  status: FileStatus;
  ingestion_status: IngestionStatus;
  size_bytes: number;
  file_size?: number; // Alias pour compatibilité
  mime_type?: string;
  created_at: string;
  updated_at: string;
  inferred_schema?: Record<string, any>;
  version?: number;
  hash?: string;
  line_count?: number;
  column_count?: number;
  uploader_id?: UUID;
  uploader_name?: string;
  parsing_error?: string;
  docs_indexed?: number;
  ingestion_errors?: string[];
  mapping_id?: UUID;
  preview_data?: Record<string, any>[];
}

export interface FilePreviewChunk {
  chunk_index: number;
  chunk_size: number;
  total_rows: number;
  rows: Record<string, any>[];
  has_more: boolean;
}

export interface FileStatusUpdate {
  event_type: 'status_update' | 'parsing_error' | 'error';
  file_id: UUID;
  status?: FileStatus;
  ingestion_status?: IngestionStatus;
  error_message?: string;
  progress?: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

