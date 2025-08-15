import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaBanner } from '../SchemaBanner';

// Mock du hook useSchema
vi.mock('../../../hooks/useSchema', () => ({
  useSchema: vi.fn(),
}));

// Import du mock après vi.mock
import { useSchema } from '../../../hooks/useSchema';

describe('SchemaBanner', () => {
  const mockUseSchema = vi.mocked(useSchema);
  const mockReload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSchema.mockReturnValue({
      offline: false,
      updated: false,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });
  });

  it('ne rend rien quand offline et updated sont false', () => {
    render(<SchemaBanner />);
    expect(screen.queryByText('Mode hors ligne')).not.toBeInTheDocument();
    expect(screen.queryByText('Schéma mis à jour')).not.toBeInTheDocument();
  });

  it('affiche le mode hors ligne quand offline est true', () => {
    mockUseSchema.mockReturnValue({
      offline: true,
      updated: false,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    expect(screen.getByText('Mode hors ligne')).toBeInTheDocument();
    expect(screen.getByText('Le schéma a été chargé depuis le cache local')).toBeInTheDocument();
    expect(screen.getByText('📡')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recharger le schéma' })).toBeInTheDocument();
  });

  it('affiche la mise à jour du schéma quand updated est true', () => {
    mockUseSchema.mockReturnValue({
      offline: false,
      updated: true,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    expect(screen.getByText('Schéma mis à jour')).toBeInTheDocument();
    expect(screen.getByText('Une nouvelle version du schéma est disponible')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recharger le schéma' })).toBeInTheDocument();
  });

  it('appelle reload quand le bouton est cliqué', () => {
    mockUseSchema.mockReturnValue({
      offline: true,
      updated: false,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    const reloadButton = screen.getByRole('button', { name: 'Recharger le schéma' });
    fireEvent.click(reloadButton);
    
    expect(mockReload).toHaveBeenCalledWith(true);
  });

  it('désactive le bouton et affiche "Chargement..." quand loading est true', () => {
    mockUseSchema.mockReturnValue({
      offline: true,
      updated: false,
      reload: mockReload,
      loading: true,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    const reloadButton = screen.getByRole('button', { name: 'Recharger le schéma' });
    expect(reloadButton).toBeDisabled();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('affiche le bouton activé et "Recharger" quand loading est false', () => {
    mockUseSchema.mockReturnValue({
      offline: true,
      updated: false,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    const reloadButton = screen.getByRole('button', { name: 'Recharger le schéma' });
    expect(reloadButton).not.toBeDisabled();
    expect(screen.getByText('Recharger')).toBeInTheDocument();
  });

  it('affiche les deux états quand offline et updated sont true', () => {
    mockUseSchema.mockReturnValue({
      offline: true,
      updated: true,
      reload: mockReload,
      loading: false,
      schema: null,
      fieldTypes: [],
      operations: [],
      version: '2.2',
      error: null,
      etag: null,
    });

    render(<SchemaBanner />);
    
    // Le composant devrait afficher quelque chose (probablement le premier état rencontré)
    expect(screen.getByRole('button', { name: 'Recharger le schéma' })).toBeInTheDocument();
  });
});
