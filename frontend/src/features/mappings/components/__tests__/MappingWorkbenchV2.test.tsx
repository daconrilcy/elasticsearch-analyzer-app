import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MappingWorkbenchV2 } from '../MappingWorkbenchV2';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créer un QueryClient pour les tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Wrapper pour les tests avec QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Mock des hooks V2.2
vi.mock('../../hooks/useSchema', () => ({
  useSchema: () => ({
    schema: { version: '2.2' },
    fieldTypes: ['keyword', 'text', 'integer'],
    operations: ['trim', 'cast', 'map'],
    offline: false,
    updated: false,
    reload: vi.fn(),
  }),
  useFieldTypes: () => ({
    fieldTypes: ['keyword', 'text', 'integer'],
    loading: false,
    error: null,
    offline: false,
  }),
  useOperations: () => ({
    operations: ['trim', 'cast', 'map'],
    loading: false,
    error: null,
    offline: false,
  }),
}));

vi.mock('../../hooks/useToasts', () => ({
    useToasts: () => ({
      toasts: [],          // ✅ évite toasts.length sur undefined
      remove: vi.fn(),     // ✅ utilisé par ToastsContainer
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  }));

vi.mock('../../hooks/useShortcuts', () => ({
  useShortcuts: vi.fn(() => ({})),
}));

vi.mock('../../hooks/useAbortable', () => ({
  useAbortable: () => ({
    signalNext: vi.fn(() => new AbortController().signal),
    abort: vi.fn(),
  }),
}));

vi.mock('../../../lib/api', () => ({
  api: {
    validateMapping: vi.fn(),
    dryRunMapping: vi.fn(),
    compileMapping: vi.fn(),
    applyMapping: vi.fn(),
    checkIds: vi.fn(),
  },
}));

// Mock des composants existants
vi.mock('../intelligence/TypeInference', () => ({
  TypeInference: ({ onTypesApplied }: any) => (
    <div data-testid="type-inference">
      <button onClick={() => onTypesApplied({ name: 'string' })}>
        Appliquer les types
      </button>
    </div>
  ),
}));

vi.mock('../SizeEstimation', () => ({
  SizeEstimation: ({ onEstimationComplete }: any) => (
    <div data-testid="size-estimation">
      <button onClick={() => onEstimationComplete({ size: '1GB' })}>
        Estimer la taille
      </button>
    </div>
  ),
}));

vi.mock('../validation', () => ({
  MappingValidator: ({ onValidationComplete }: any) => (
    <div data-testid="mapping-validator">
      <button onClick={() => onValidationComplete({ valid: true })}>
        Valider
      </button>
    </div>
  ),
  IdPolicyEditor: ({ onIdPolicyChange, onCheckIds }: any) => (
    <div data-testid="id-policy-editor">
      <button onClick={() => onIdPolicyChange({ from: ['id'] })}>
        Mettre à jour la politique
      </button>
      <button onClick={onCheckIds}>
        Vérifier les IDs
      </button>
    </div>
  ),
}));

vi.mock('../MappingDryRun', () => ({
  MappingDryRun: ({ onDryRunComplete }: any) => (
    <div data-testid="mapping-dry-run">
      <button onClick={() => onDryRunComplete({ success: true })}>
        Lancer le dry-run
      </button>
    </div>
  ),
}));

vi.mock('../MappingCompiler', () => ({
  MappingCompiler: ({ onCompilationComplete }: any) => (
    <div data-testid="mapping-compiler">
      <button onClick={() => onCompilationComplete({ compiled_hash: 'abc123' })}>
        Compiler
      </button>
    </div>
  ),
}));

vi.mock('../MappingApply', () => ({
  MappingApply: ({ onApplyComplete }: any) => (
    <div data-testid="mapping-apply">
      <button onClick={() => onApplyComplete({ success: true })}>
        Appliquer
      </button>
    </div>
  ),
}));

vi.mock('../MetricsBanner', () => ({
  MetricsBanner: () => <div data-testid="metrics-banner">Metrics Banner</div>,
}));

vi.mock('../JSONPathPlayground', () => ({
  JSONPathPlayground: ({ onPathSelect }: any) => (
    <div data-testid="jsonpath-playground">
      <button onClick={() => onPathSelect('$.name')}>
        Sélectionner le chemin
      </button>
    </div>
  ),
}));

// Mock des composants V2.2.1
vi.mock('../field_management/FieldsGrid', () => ({
  FieldsGrid: ({ onAddField, onRemoveField, onFieldChange, onFieldsReorder }: any) => (
    <div data-testid="fields-grid">
      <div className="field-types">
        <button onClick={() => onAddField()}>keyword</button>
        <button onClick={() => onAddField()}>text</button>
        <button onClick={() => onAddField()}>integer</button>
      </div>
      <div className="fields-actions">
        <button onClick={onAddField}>Ajouter un champ</button>
        <button onClick={() => onRemoveField('field1')}>Supprimer un champ</button>
        <button onClick={() => onFieldChange('field1', { type: 'text' })}>Modifier un champ</button>
        <button onClick={() => onFieldsReorder([])}>Réorganiser</button>
      </div>
    </div>
  ),
}));

vi.mock('../intelligence/OperationSuggestions', () => ({
  default: () => (
    <div data-testid="operation-suggestions">
      <h4>Suggestions d'opérations</h4>
      <p>Suggestions basées sur l'IA</p>
    </div>
  ),
}));

vi.mock('../studio/PresetsShowcase', () => ({
  default: () => (
    <div data-testid="presets-showcase">
      <h4>Presets disponibles</h4>
      <p>Modèles prédéfinis</p>
    </div>
  ),
}));

vi.mock('../studio/UnifiedDiffView', () => ({
  default: () => (
    <div data-testid="unified-diff-view">
      <h4>Vue unifiée des différences</h4>
      <p>Comparaison des mappings</p>
    </div>
  ),
}));

vi.mock('../studio/ShareableExport', () => ({
  default: () => (
    <div data-testid="shareable-export">
      <h4>Export partageable</h4>
      <p>Export en différents formats</p>
    </div>
  ),
}));

const mockMapping = {
  name: 'test_mapping',
  fields: [
    {
      id: 'field1',
      target: 'test_field',
      type: 'text',
      input: [{ kind: 'column', name: 'name' }],
      pipeline: [
        { id: 'op1', type: 'trim', config: {} }
      ]
    }
  ]
};

const mockSampleData = [
  { name: 'Test', value: 123 }
];

describe('MappingWorkbenchV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('🎯 Atelier de Mapping V2.2')).toBeInTheDocument();
  });

  it('displays all tabs correctly', () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('✅ Validation')).toBeInTheDocument();
    expect(screen.getByText('🧠 Intelligence')).toBeInTheDocument();
    expect(screen.getByText('🔄 Cycle de Vie')).toBeInTheDocument();
    expect(screen.getByText('🎨 Studio V2.2')).toBeInTheDocument();
  });

  it('shows validation tab content by default', () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('Validation et Conformité')).toBeInTheDocument();
    expect(screen.getByTestId('mapping-validator')).toBeInTheDocument();
    expect(screen.getByTestId('id-policy-editor')).toBeInTheDocument();
  });

  it('switches to intelligence tab when clicked', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const intelligenceTab = screen.getByText('🧠 Intelligence');
    fireEvent.click(intelligenceTab);
    
    await waitFor(() => {
      expect(screen.getByText('Intelligence Artificielle')).toBeInTheDocument();
      expect(screen.getByText('Utilisez l\'IA pour inférer les types et estimer la taille de votre index.')).toBeInTheDocument();
      expect(screen.getByText('📄 Prévisualisation des Documents')).toBeInTheDocument();
    });
  });

  it('switches to lifecycle tab when clicked', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const lifecycleTab = screen.getByText('🔄 Cycle de Vie');
    fireEvent.click(lifecycleTab);
    
    await waitFor(() => {
      expect(screen.getByText('Cycle de Vie Complet')).toBeInTheDocument();
      expect(screen.getByText('Gestion complète du mapping : validation → dry-run → compilation → application.')).toBeInTheDocument();
      expect(screen.getByText('Dry-Run du Mapping')).toBeInTheDocument();
      expect(screen.getByText('Compilation du Mapping')).toBeInTheDocument();
      expect(screen.getByText('Application du Mapping')).toBeInTheDocument();
    });
  });

  it('switches to studio tab when clicked', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('🎨 Studio V2.2 - Interface Avancée')).toBeInTheDocument();
      expect(screen.getByText('📝 Gestion des Champs')).toBeInTheDocument();
      expect(screen.getByText('🔧 Pipeline d\'opérations')).toBeInTheDocument();
    });
  });

  it('displays schema information in studio tab', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('🎨 Studio V2.2 - Interface Avancée')).toBeInTheDocument();
      expect(screen.getByText('📝 Gestion des Champs')).toBeInTheDocument();
      expect(screen.getByText('🔧 Pipeline d\'opérations')).toBeInTheDocument();
    });
  });

  it('shows field type buttons in studio tab', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('keyword')).toBeInTheDocument();
      expect(screen.getByText('text')).toBeInTheDocument();
      expect(screen.getByText('integer')).toBeInTheDocument();
    });
  });

  it('calls onMappingUpdate when field type is clicked', async () => {
    const mockOnMappingUpdate = vi.fn();
    
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={mockOnMappingUpdate}
        />
      </TestWrapper>
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      const keywordButton = screen.getByText('keyword');
      fireEvent.click(keywordButton);
    });
    
    expect(mockOnMappingUpdate).toHaveBeenCalled();
  });

  it('displays pipeline operations in studio tab', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('trim')).toBeInTheDocument();
    });
  });

  it('shows lifecycle steps correctly', async () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    const lifecycleTab = screen.getByText('🔄 Cycle de Vie');
    fireEvent.click(lifecycleTab);
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
      expect(screen.getByText('Dry-Run')).toBeInTheDocument();
      expect(screen.getByText('Compilation')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();
    });
  });

  it('displays footer with progress and status', () => {
    render(
      <TestWrapper>
        <MappingWorkbenchV2
          mapping={mockMapping}
          sampleData={mockSampleData}
          onMappingUpdate={vi.fn()}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('🎉 Mapping Studio V2.2 - 100% implémenté !')).toBeInTheDocument();
    expect(screen.getByText('✅ Anti-drift schéma')).toBeInTheDocument();
    expect(screen.getByText('✅ Performance optimisée')).toBeInTheDocument();
    expect(screen.getByText('✅ UX/UI moderne')).toBeInTheDocument();
    expect(screen.getByText('✅ DnD + Templates')).toBeInTheDocument();
  });
});
