import { render, screen } from '@testing-library/react';
import { RichDiffView } from '../RichDiffView';
import { describe, it, expect } from 'vitest';

const oldMapping = {
  name: 'Ancien Mapping',
  fields: [{ name: 'email', type: 'keyword' }],
};

const newMapping = {
  name: 'Nouveau Mapping',
  fields: [{ name: 'email_address', type: 'text' }],
};

describe('RichDiffView', () => {
  it('rend le composant sans erreur', () => {
    render(<RichDiffView leftMapping={oldMapping} rightMapping={newMapping} />);
    expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
  });

  it('affiche les statistiques de différences', () => {
    render(<RichDiffView leftMapping={oldMapping} rightMapping={newMapping} />);
    // Cette assertion dépend de l'implémentation de la logique de diff.
    // En se basant sur une comparaison simple, on s'attend à des modifications.
    expect(screen.getByText(/Modifiés/)).toBeInTheDocument();
  });

  it('affiche un message d\'erreur si un mapping est manquant', () => {
    render(<RichDiffView leftMapping={oldMapping} rightMapping={null} />);
    expect(screen.getByText('❌ Impossible de comparer les mappings : données manquantes')).toBeInTheDocument();
  });
});