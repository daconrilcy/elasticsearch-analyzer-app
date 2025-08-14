// Types pour le Mapping Studio V2.2

export interface SchemaInfo {
  schema: any;
  fieldTypes: string[];
  operations: string[];
  version: string;
  loading: boolean;
  error: string | null;
  offline: boolean;
  updated: boolean;
  etag: string | null;
  reload: (force?: boolean) => Promise<void>;
}

export interface Operation {
  id: string;
  type: string;
  config: Record<string, any>;
}

export interface DSLTemplate {
  id: string;
  name: string;
  description: string;
  dsl: MappingDSL;
}

export interface MappingDSL {
  version: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  pipeline: Operation[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface ShortcutHandlers {
  onRun?: () => void;
  onExport?: () => void;
  onSave?: () => void;
}

export interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export interface Document {
  _id: string;
  _source: any;
  [key: string]: any;
}

export interface DocsPreviewVirtualizedProps {
  documents: Document[];
  height?: number;
  itemSize?: number;
  initialLimit?: number;
  incrementSize?: number;
}

export interface PipelineDnDProps {
  operations: Operation[];
  onChange: (operations: Operation[]) => void;
  renderOperation: (operation: Operation) => React.ReactNode;
  className?: string;
}

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export interface TemplatesMenuProps {
  onApply: (template: DSLTemplate) => void;
  className?: string;
}

export interface DiffViewProps {
  oldMapping: any;
  newMapping: any;
  className?: string;
}

export interface SchemaBannerProps {
  className?: string;
}

export interface ShortcutsHelpProps {
  className?: string;
}

export interface ToastsContainerProps {
  className?: string;
}

// Types pour l'API
export interface APIResponse<T = any> {
  status: number;
  data: T | null;
  etag?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface DryRunResult {
  documents: Document[];
  count: number;
  processing_time_ms: number;
}

export interface CompileResult {
  compiled_mapping: any;
  execution_plan?: any;
  estimated_size_bytes?: number;
}

export interface ApplyResult {
  success: boolean;
  index_name: string;
  document_count: number;
  processing_time_ms: number;
}

export interface IdCheckResult {
  valid: boolean;
  conflicts?: string[];
  suggestions?: string[];
}

export interface TypeInferenceResult {
  inferred_types: Record<string, string>;
  confidence_scores: Record<string, number>;
}

export interface SizeEstimationResult {
  estimated_size_bytes: number;
  field_count: number;
  sample_document_size_bytes: number;
}

// Types pour les hooks
export interface UseSchemaReturn extends SchemaInfo {}

export interface UseFieldTypesReturn {
  fieldTypes: string[];
  loading: boolean;
  error: string | null;
  offline: boolean;
}

export interface UseOperationsReturn {
  operations: string[];
  loading: boolean;
  error: string | null;
  offline: boolean;
}

export interface UseSchemaVersionReturn {
  version: string;
  loading: boolean;
  error: string | null;
  offline: boolean;
}

export interface UseToastsReturn {
  toasts: Toast[];
  show: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export interface UseShortcutsReturn {
  isShortcutActive: (key: string, modifier?: 'cmd' | 'ctrl') => boolean;
}

export interface UseAbortableReturn {
  signalNext: () => AbortSignal;
  abort: () => void;
  getCurrentSignal: () => AbortSignal | undefined;
}

// Types pour les composants de démonstration
export interface MappingStudioV2DemoProps {
  className?: string;
}

export interface MappingStudioV2DemoState {
  mapping: MappingDSL;
  previousMapping: MappingDSL | null;
}

// Types utilitaires
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Types pour les événements
export interface MappingChangeEvent {
  type: 'field_added' | 'field_removed' | 'field_modified' | 'operation_reordered';
  field?: Field;
  operation?: Operation;
  oldIndex?: number;
  newIndex?: number;
  timestamp: number;
}

export interface SchemaUpdateEvent {
  type: 'schema_updated' | 'schema_offline' | 'schema_error';
  previousVersion?: string;
  newVersion?: string;
  error?: string;
  timestamp: number;
}

// Types pour la configuration
export interface MappingStudioConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    shortcuts: boolean;
    animations: boolean;
  };
  performance: {
    debounceDelay: number;
    rateLimit: number;
    virtualizationThreshold: number;
    cacheSize: number;
  };
  features: {
    dragAndDrop: boolean;
    templates: boolean;
    diffView: boolean;
    shortcuts: boolean;
    toasts: boolean;
  };
}
