import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MappingWorkbench } from '../MappingWorkbench';

// Mock global de fetch pour éviter les appels réseau réels
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  } as Response) // Cast en Response pour satisfaire TypeScript
);

// Mock des hooks pour isoler le composant
vi.mock('../hooks/useSchema', () => ({
  useSchema: () => ({ data: { properties: {} }, isLoading: false, isError: false }),
}));

vi.mock('../hooks/useDictionaries', () => ({
  useDictionaries: () => ({ data: {}, isLoading: false, isError: false }),
}));

vi.mock('../hooks/useMetrics', () => ({
  useMetrics: () => ({ 
    data: {
      total_mappings: 10,
      total_indexed_documents: 1000,
      average_processing_time_ms: 50,
    }, 
    isLoading: false, 
    isError: false 
  }),
}));

const queryClient = new QueryClient();

// Création d'un objet mapping de base pour les props
const mockMapping = {
  id: '1',
  name: 'Test Mapping',
  mapping_rules: [],
  settings: {},
};

describe('MappingWorkbench', () => {
  beforeEach(() => {
    (fetch as any).mockClear();
  });

  it('should render the main components', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MappingWorkbench mapping={mockMapping} sampleData={[]} onMappingUpdate={vi.fn()} />
      </QueryClientProvider>
    );

    // Utiliser `waitFor` pour s'assurer que tous les états asynchrones sont résolus
    await waitFor(() => {
      // Les textes sont dans des composants enfants qui peuvent ne pas être immédiatement disponibles.
      // On vérifie les textes qui sont directement dans MappingWorkbench ou ses enfants immédiats.
      expect(screen.getByText(/Atelier de Mapping/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Validation/i })).toBeInTheDocument();
      
      // On peut aussi vérifier la présence d'un composant enfant par son titre, ce qui est plus robuste.
      expect(screen.getByRole('heading', { name: /Validation du Mapping/i })).toBeInTheDocument();
    });
  });
});
