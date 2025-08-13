import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MappingValidator } from '../MappingValidator';

const queryClient = new QueryClient();

describe('MappingValidator', () => {
  it('should render the validate button after expanding', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MappingValidator mapping={{}} onValidationComplete={vi.fn()} />
      </QueryClientProvider>
    );

    // On déplie le composant pour rendre le bouton visible
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    expect(screen.getByRole('button', { name: /Valider le Mapping/i })).toBeInTheDocument();
  });

  it('should display validation results after expanding', async () => {
    // FIX: Fournir une réponse simulée complète avec toutes les propriétés attendues.
    const mockResponse = { 
      is_valid: true, 
      issues: [],
      schema_version: '1.0.0',
      processing_time_ms: 123
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MappingValidator mapping={{}} onValidationComplete={vi.fn()} />
      </QueryClientProvider>
    );

    // On déplie le composant
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    // On clique sur le bouton de validation
    await userEvent.click(screen.getByRole('button', { name: /Valider le Mapping/i }));

    // Le test cherche maintenant un texte plus spécifique qui apparaît en cas de succès.
    expect(await screen.findByText(/Aucun problème détecté. Le mapping est valide !/i)).toBeInTheDocument();
  });
});
