// ⚠️ Place ce mock tout en haut du fichier de test, avant d'importer CreateMappingModal
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('reactflow', async () => {
  const actual = await vi.importActual<any>('reactflow');

  const MockReactFlow = ({ nodes = [], edges = [], children, ...props }: any) => (
    <div data-testid="rf__wrapper" {...props}>
      <ul data-testid="rf__nodes">
        {nodes.map((n: any) => (
          <li key={n.id}>{n?.data?.label}</li>
        ))}
      </ul>
      <ul data-testid="rf__edges">
        {edges.map((e: any, i: number) => (
          <li key={i}>{e.source}-{e.target}</li>
        ))}
      </ul>
      {children}
    </div>
  );

  return {
    ...actual,
    default: MockReactFlow,                 // <— important : on remplace le *default export*
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
    applyNodeChanges: vi.fn(),
    applyEdgeChanges: vi.fn(),
    addEdge: vi.fn(),
  };
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateMappingModal } from '../CreateMappingModal';
import { createMapping, getFileDetails } from '@shared/lib';
import type { FileOut } from '@shared/types';

// Mock des modules externes
vi.mock('@shared/lib', () => ({
  createMapping: vi.fn(),
  getFileDetails: vi.fn(),
}));

const mockFile: FileOut = {
  id: 'file-1',
  filename_original: 'test.csv',
  filename_stored: 'test_stored.csv',
  size_bytes: 1024,
  uploaded_at: '2024-01-01T00:00:00Z',
  status: 'processed',
  dataset_id: 'dataset-1',
};

const mockFileDetails = {
  id: 'file-1',
  filename_original: 'test.csv',
  inferred_schema: {
    name: 'string',
    age: 'number',
    email: 'string',
  },
  size_bytes: 1024,
  uploaded_at: '2024-01-01T00:00:00Z',
  status: 'processed',
  dataset_id: 'dataset-1',
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CreateMappingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getFileDetails as any).mockResolvedValue(mockFileDetails);
    (createMapping as any).mockResolvedValue({ id: 'mapping-1' });
  });

  it('should render modal when open', async () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    expect(screen.getByText('Créer un Mapping')).toBeInTheDocument();
    
    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, element) => {
        return element?.textContent?.includes('Fichier source : test.csv') || false;
      });
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });
  });

  it('should not render when closed', () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={false}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    expect(screen.queryByText('Créer un Mapping')).not.toBeInTheDocument();
  });

  it('should show loading state while fetching file details', () => {
    (getFileDetails as any).mockImplementation(() => new Promise(() => {}));

    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    expect(screen.getByText('Chargement des détails du fichier...')).toBeInTheDocument();
  });

  it('should display file info and mapping form when loaded', async () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText('Nom du mapping')).toBeInTheDocument();
    });
  });

  it('should create source nodes from inferred schema', async () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('name (string)')).toBeInTheDocument();
      expect(screen.getByText('age (number)')).toBeInTheDocument();
      expect(screen.getByText('email (string)')).toBeInTheDocument();
    });
  });

  it('should set default mapping name from filename', async () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Nom du mapping') as HTMLInputElement;
      expect(nameInput.value).toBe('Mapping pour test.csv');
    });
  });

  it('should add target node when clicking add button', async () => {
    const user = userEvent.setup();
    
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    const addButton = screen.getByText('Ajouter un champ cible');
    await user.click(addButton);

    // Vérifier qu'un nouveau nœud cible a été ajouté
    expect(screen.getByText('NouveauChamp')).toBeInTheDocument();
  });

  it('should allow editing mapping name', async () => {
    const user = userEvent.setup();
    
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    const nameInput = screen.getByPlaceholderText('Nom du mapping');
    await user.clear(nameInput);
    await user.type(nameInput, 'Mon Mapping Personnalisé');

    expect(nameInput).toHaveValue('Mon Mapping Personnalisé');
  });

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={onClose}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call createMapping when save button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    const saveButton = screen.getByText('Enregistrer');
    await user.click(saveButton);

    await waitFor(() => {
      expect(createMapping).toHaveBeenCalledWith('dataset-1', {
        name: 'Mapping pour test.csv',
        source_file_id: 'file-1',
        mapping_rules: [],
      });
    });
  });

  it('should show error message when file details fail to load', async () => {
    (getFileDetails as any).mockRejectedValue(new Error('Failed to load'));

    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des détails du fichier.')).toBeInTheDocument();
    });
  });

  it('should render ReactFlow with correct props', async () => {
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    // Vérifier que ReactFlow est rendu avec le bon data-testid
    expect(screen.getByTestId('rf__wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  it('should disable save button while mutation is pending', async () => {
    (createMapping as any).mockImplementation(() => new Promise(() => {})); // ne se résout jamais
    const user = userEvent.setup();
    
    renderWithQueryClient(
      <CreateMappingModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        datasetId="dataset-1"
      />
    );

    await waitFor(() => {
      const fileInfoElements = screen.getAllByText((_, el) => el?.textContent?.includes('Fichier source : test.csv') || false);
      expect(fileInfoElements.length).toBeGreaterThan(0);
    });

    const saveButton = screen.getByText('Enregistrer');
    await user.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent('Enregistrement...');
    });
  });
});
