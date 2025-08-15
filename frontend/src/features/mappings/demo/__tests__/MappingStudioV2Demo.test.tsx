import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------- HOISTED (utilisé dans les factories de vi.mock) ----------
const { schemaMock, toastsFactory, shortcutsFactory, abortableFactory } = vi.hoisted(() => {
  return {
    schemaMock: {
      schema: { version: '2.2' },
      fieldTypes: ['keyword', 'text', 'integer'],
      operations: ['trim', 'cast', 'map'],
      offline: false,
      updated: false,
      reload: vi.fn(),
    },
    toastsFactory: () => ({ 
      toasts: [], 
      success: vi.fn(), 
      error: vi.fn(), 
      info: vi.fn(),
      remove: vi.fn()
    }),
    shortcutsFactory: () => ({
      isShortcutActive: vi.fn(() => false),
      registerShortcut: vi.fn(),
      unregisterShortcut: vi.fn()
    }),
    abortableFactory: () => ({
      signalNext: () => new AbortController().signal,
      abort: vi.fn(),
    }),
  };
});

// ---------- MOCKS (avant tout import du composant) ----------
// On moque le barrel ET les chemins directs, comme le composant peut importer l’un ou l’autre.
vi.mock('@features/mappings/hooks', () => ({
  useSchema: () => schemaMock,
  useToasts: toastsFactory,
  useShortcuts: shortcutsFactory,
  useAbortable: abortableFactory,
}));
vi.mock('@features/mappings/hooks/useSchema', () => ({ useSchema: () => schemaMock }));
vi.mock('@features/mappings/hooks/useToasts', () => ({ useToasts: toastsFactory }));
vi.mock('@features/mappings/hooks/useShortcuts', () => ({ useShortcuts: shortcutsFactory }));
vi.mock('@features/mappings/hooks/useAbortable', () => ({ useAbortable: abortableFactory }));

// Sous-composants simplifiés
vi.mock('@features/mappings/components/PipelineDnD', () => ({
  PipelineDnD: ({ operations }: { operations: any[] }) =>
    operations && operations.length
      ? <div data-testid="ops-count">{operations.length}</div>
      : <div>Aucune opération dans le pipeline</div>,
}));
vi.mock('@features/mappings/components/TemplatesMenu', () => ({
    TemplatesMenu: ({ onApply }: { onApply: (t: any) => void }) => (
      <div>
        <button
          onClick={() =>
            onApply?.({
              id: 'demo',
              name: 'Template démo',
              // *** le composant attend "dsl" ***
              dsl: { version: '2.2', fields: [] }, // champs vide = OK
            })
          }
        >
          📋 Templates DSL
        </button>
        <div>Templates disponibles</div>
      </div>
    ),
  }));
vi.mock('@features/mappings/components/ShortcutsHelp', () => ({
  ShortcutsHelp: () => (
    <div>
      <button>⌨️ Raccourcis</button>
      <div>Raccourcis clavier</div>
    </div>
  ),
}));
vi.mock('@features/mappings/components/ToastsContainer', () => ({ ToastsContainer: () => <div data-testid="toasts" /> }));
vi.mock('@features/mappings/components/SchemaBanner', () => ({ SchemaBanner: () => <div data-testid="schema-banner" /> }));

// ⚠️ NE PAS importer le composant ici. On va le charger dynamiquement APRÈS stub ENV.

// Helper: charge le composant avec ENV stub et cache modules reset
async function loadComponent() {
  vi.resetModules(); // vide le cache ESM pour réévaluer import.meta.env
  vi.stubEnv('VITE_API_BASE', 'http://test'); // défini AVANT l’import
  const mod = await import('@features/mappings/demo/MappingStudioV2Demo'); // import dynamique
  return mod.MappingStudioV2Demo;
}

describe('MappingStudioV2Demo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend le header', async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);
    expect(screen.getByText('🎯 Mapping Studio V2.2')).toBeInTheDocument();
  });

  it('affiche les types et opérations disponibles', async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);

    expect(screen.getByText('keyword')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('integer')).toBeInTheDocument();

    expect(screen.getByText('trim')).toBeInTheDocument();
    expect(screen.getByText('cast')).toBeInTheDocument();
    expect(screen.getByText('map')).toBeInTheDocument();
  });

  it('affiche les actions et sections', async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);
    expect(screen.getByText('🔍 Valider')).toBeInTheDocument();
    expect(screen.getByText('💾 Sauvegarder')).toBeInTheDocument();
    expect(screen.getByText('↩️ Annuler')).toBeInTheDocument();
    expect(screen.getByText('Types de champs disponibles')).toBeInTheDocument();
    expect(screen.getByText('Opérations disponibles')).toBeInTheDocument();
    expect(screen.getByText("Pipeline d'opérations")).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('ouvre Templates et Raccourcis', async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);

    fireEvent.click(screen.getByText('📋 Templates DSL'));
    await waitFor(() => expect(screen.getByText('Templates disponibles')).toBeInTheDocument());

    fireEvent.click(screen.getByText('⌨️ Raccourcis'));
    await waitFor(() => expect(screen.getByText('Raccourcis clavier')).toBeInTheDocument());
  });

  it("affiche l'état et le footer", async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);
    expect(screen.getByText(/État:/)).toBeInTheDocument();
    expect(screen.getByText(/Schéma:/)).toBeInTheDocument();
    expect(screen.getByText(/Version:/)).toBeInTheDocument();
  });

  it('pipeline vide par défaut', async () => {
    const MappingStudioV2Demo = await loadComponent();
    render(<MappingStudioV2Demo />);
    expect(screen.getByText('Aucune opération dans le pipeline')).toBeInTheDocument();
  });
});
