import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MappingDryRun } from '../MappingDryRun';

const queryClient = new QueryClient();
const mockSampleData = [{ "user": "John Doe", "age": 30 }];

describe('MappingDryRun', () => {
  it('should render the dry run button after expanding', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MappingDryRun mapping={{ id: '1' }} sampleData={mockSampleData} onDryRunComplete={vi.fn()} />
      </QueryClientProvider>
    );

    // On déplie le composant pour rendre le bouton visible
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    expect(screen.getByRole('button', { name: /Lancer le Dry-Run/i })).toBeInTheDocument();
  });

  it('should show results when dry run is complete', async () => {
    const mockResponse = { 
      success: true, 
      docs_preview: [{ _id: '1', _source: { a: 1 } }],
      issues: [],
      total_lines: 1,
      success_count: 1,
      failed_count: 0,
      processing_time_ms: 50
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MappingDryRun mapping={{ id: '1' }} sampleData={mockSampleData} onDryRunComplete={vi.fn()} />
      </QueryClientProvider>
    );

    // On déplie le composant
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    // On clique sur le bouton de dry run
    await userEvent.click(screen.getByRole('button', { name: /Lancer le Dry-Run/i }));

    // On attend que le titre des résultats soit affiché
    expect(await screen.findByText(/Résultats du Dry-Run/i)).toBeInTheDocument();
    
    // Cliquer sur le bouton pour afficher l'aperçu des documents
    const showPreviewButton = await screen.findByRole('button', { name: /Afficher l'aperçu/i });
    await userEvent.click(showPreviewButton);

    // FIX: Rechercher la chaîne JSON exacte, sans espace après le deux-points.
    // Le composant peut aussi tronquer le texte, donc on cherche le début de la chaîne.
    expect(screen.getByText(/\{"a":1\}/)).toBeInTheDocument();
  });
});
