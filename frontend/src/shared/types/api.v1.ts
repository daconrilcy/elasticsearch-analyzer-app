// src/types/api.v1.ts
// SOURCE DE VÉRITÉ POUR LES TYPES DE DONNÉES ÉCHANGÉS AVEC L'API V1

// --- Types pour l'Authentification ---
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// --- Types pour les Datasets et Fichiers ---
export const FileStatus = {
  PENDING: "pending",
  PARSING: "parsing",
  READY: "ready",
  ERROR: "error",
} as const;
export type FileStatus = typeof FileStatus[keyof typeof FileStatus];

export const IngestionStatus = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export type IngestionStatus = typeof IngestionStatus[keyof typeof IngestionStatus];

export interface Dataset {
  id: string; 
  name: string;
  description?: string | null;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetDetailOut extends Dataset {
  files: FileOut[];
  mappings: MappingOut[];
}

export interface FileOut {
  id: string;
  filename_original: string;
  version: number;
  size_bytes: number;
  status: FileStatus;
  ingestion_status: IngestionStatus;
  created_at: string;
  ingestion_errors?: string[] | null;
}

export interface FileDetailOut extends FileOut {
  hash: string;
  inferred_schema?: Record<string, any> | null;
  docs_indexed?: number | null;
  ingestion_errors?: string[] | null;
  uploader_id: string;
}


// Un type plus complet pour les détails d'un fichier
export interface FileDetail extends FileOut {
  hash: string;
  created_at: string;
  updated_at: string;
  uploader_name: string;
  parsing_error?: string | null;
  line_count: number;
  column_count: number;
  preview_data: Array<Record<string, any>>;
  mapping_id?: string | null;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  schema: any[];
}

// --- Types pour les Mappings et l'Ingestion ---
export interface MappingRule {
  source: string;
  target: string;
  es_type: string;
  analyzer_project_id?: string | null;
}

export interface MappingOut {
  id: string;
  name: string;
  source_file_id: string;
  dataset_id: string;
  mapping_rules: MappingRule[];
  created_at: string;
  updated_at: string;
  index_name?: string | null;
}

export interface MappingCreate {
  name: string;
  source_file_id: string;
  mapping_rules: MappingRule[];
}

export interface IngestionResponse {
  job_id: string;
  status: string;
}

export interface StatusResponse {
  job_id: string;
  status: 'in_progress' | 'success' | 'error';
  detail?: string;
}

// --- Types pour les Projets (Analyzers) ---
export interface ProjectListItem {
  id: number;
  name: string;
}

export interface FullProject {
  id: number;
  name: string;
  description?: string;
  graph: any; // Le graphe vient en JSON de la BDD
}