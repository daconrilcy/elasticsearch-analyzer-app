import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MappingCompiler } from '../MappingCompiler';

const queryClient = new QueryClient();

describe('MappingCompiler', () => {
  it('should render the compile button after expanding', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MappingCompiler mapping={{ id: '1' }} onCompilationComplete={vi.fn()} />
      </QueryClientProvider>
    );
    
    // On déplie le composant pour afficher le contenu
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    
    expect(screen.getByRole('button', { name: /Compiler le Mapping/i })).toBeInTheDocument();
  });

  it('should call onCompilationComplete when compilation is successful', async () => {
    const onCompilationComplete = vi.fn();
    const mockResponse = { 
      success: true, 
      compiled_mapping: {}, 
      compiled_hash: '123def456abc',
      warnings: [],
      errors: [],
      processing_time_ms: 100 // Ajout pour éviter un crash potentiel si le composant l'utilise
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MappingCompiler mapping={{ id: '1' }} onCompilationComplete={onCompilationComplete} />
      </QueryClientProvider>
    );

    // On déplie le composant
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    // On clique sur le bouton de compilation
    await userEvent.click(screen.getByRole('button', { name: /Compiler le Mapping/i }));

    // FIX: Chercher un texte qui est réellement affiché lors du succès.
    await screen.findByText(/Résultats de la Compilation/i);
    
    // On peut aussi vérifier que le hash est affiché
    expect(screen.getByText(/123def456abc/i)).toBeInTheDocument();

    // On vérifie que le callback est appelé avec la bonne réponse
    expect(onCompilationComplete).toHaveBeenCalledWith(mockResponse);
  });
});
