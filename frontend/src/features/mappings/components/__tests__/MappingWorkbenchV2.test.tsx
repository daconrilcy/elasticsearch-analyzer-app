import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MappingWorkbenchV2 } from '../MappingWorkbenchV2';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
vi.mock('../TypeInference', () => ({
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

vi.mock('../MappingValidator', () => ({
  MappingValidator: ({ onValidationComplete }: any) => (
    <div data-testid="mapping-validator">
      <button onClick={() => onValidationComplete({ valid: true })}>
        Valider
      </button>
    </div>
  ),
}));

vi.mock('../IdPolicyEditor', () => ({
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

const mockMapping = {
  name: 'test_mapping',
  fields: [
    {
      name: 'test_field',
      type: 'text',
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
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    expect(screen.getByText('🎯 Atelier de Mapping V2.2')).toBeInTheDocument();
  });

  it('displays all tabs correctly', () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    expect(screen.getByText('✅ Validation')).toBeInTheDocument();
    expect(screen.getByText('🧠 Intelligence')).toBeInTheDocument();
    expect(screen.getByText('🔄 Cycle de Vie')).toBeInTheDocument();
    expect(screen.getByText('🎨 Studio V2.2')).toBeInTheDocument();
  });

  it('shows validation tab content by default', () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    expect(screen.getByText('Validation et Conformité')).toBeInTheDocument();
    expect(screen.getByTestId('mapping-validator')).toBeInTheDocument();
    expect(screen.getByTestId('id-policy-editor')).toBeInTheDocument();
  });

  it('switches to intelligence tab when clicked', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    const intelligenceTab = screen.getByText('🧠 Intelligence');
    fireEvent.click(intelligenceTab);
    
    await waitFor(() => {
      expect(screen.getByText('Intelligence Artificielle')).toBeInTheDocument();
      expect(screen.getByTestId('type-inference')).toBeInTheDocument();
      expect(screen.getByTestId('size-estimation')).toBeInTheDocument();
      expect(screen.getByTestId('jsonpath-playground')).toBeInTheDocument();
    });
  });

  it('switches to lifecycle tab when clicked', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    const lifecycleTab = screen.getByText('🔄 Cycle de Vie');
    fireEvent.click(lifecycleTab);
    
    await waitFor(() => {
      expect(screen.getByText('Cycle de Vie Complet')).toBeInTheDocument();
      expect(screen.getByTestId('mapping-dry-run')).toBeInTheDocument();
      expect(screen.getByTestId('mapping-compiler')).toBeInTheDocument();
      expect(screen.getByTestId('mapping-apply')).toBeInTheDocument();
    });
  });

  it('switches to studio tab when clicked', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('🎨 Studio V2.2 - Interface Avancée')).toBeInTheDocument();
      expect(screen.getByText('📚 Schéma Dynamique')).toBeInTheDocument();
      expect(screen.getByText('🔧 Pipeline d\'opérations')).toBeInTheDocument();
    });
  });

  it('displays schema information in studio tab', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('Types: 3')).toBeInTheDocument();
      expect(screen.getByText('Opérations: 3')).toBeInTheDocument();
    });
  });

  it('shows field type buttons in studio tab', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
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
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={mockOnMappingUpdate}
      />
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
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    const studioTab = screen.getByText('🎨 Studio V2.2');
    fireEvent.click(studioTab);
    
    await waitFor(() => {
      expect(screen.getByText('trim')).toBeInTheDocument();
    });
  });

  it('shows lifecycle steps correctly', async () => {
    render(
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
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
      <MappingWorkbenchV2
        mapping={mockMapping}
        sampleData={mockSampleData}
        onMappingUpdate={vi.fn()}
      />
    );
    
    expect(screen.getByText('🎉 Mapping Studio V2.2 - 100% implémenté !')).toBeInTheDocument();
    expect(screen.getByText('✅ Anti-drift schéma')).toBeInTheDocument();
    expect(screen.getByText('✅ Performance optimisée')).toBeInTheDocument();
    expect(screen.getByText('✅ UX/UI moderne')).toBeInTheDocument();
    expect(screen.getByText('✅ DnD + Templates')).toBeInTheDocument();
  });
});
