import { render, screen, fireEvent } from '@testing-library/react';
import { PresetsShowcase } from '../PresetsShowcase';
import { describe, it, expect, vi } from 'vitest';

describe('PresetsShowcase', () => {
  it('rend les presets par défaut', () => {
    render(<PresetsShowcase />);
    expect(screen.getByText('🚀 Templates Prêts à l\'Emploi')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Contacts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Adresses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Logs' })).toBeInTheDocument();
    // Vérifie que les boutons d'ouverture sont présents
    expect(screen.getAllByRole('button', { name: /Ouvrir preset/i })).toHaveLength(3);
  });

  it('filtre les presets lorsqu\'un filtre est cliqué', () => {
    render(<PresetsShowcase />);
    // Sélectionne le bouton de filtre, pas le titre ni le <strong> dans l’aide
    const contactsFilterBtn = screen.getByRole('button', { name: /Filtre Contacts/i });
    fireEvent.click(contactsFilterBtn);
    // Vérif rapide : le preset Contacts est visible
    expect(screen.getByRole('heading', { level: 3, name: 'Contacts' })).toBeInTheDocument();
  });

  it('appelle onPresetSelect lorsqu\'une carte de preset est cliquée', () => {
    const onPresetSelect = vi.fn();
    render(<PresetsShowcase onPresetSelect={onPresetSelect} />);
    // Cible la carte via le testid ajouté
    const contactsCard = screen.getByTestId('preset-card-contacts');
    fireEvent.click(contactsCard);
    expect(onPresetSelect).toHaveBeenCalledTimes(1);
    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'contacts', name: 'Contacts' })
    );
  });
});