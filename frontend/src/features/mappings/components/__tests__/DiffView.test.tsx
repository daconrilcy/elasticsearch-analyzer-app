import { render, screen } from '@testing-library/react';
import { DiffView } from '../DiffView';

const oldMapping = {
  version: '2.1',
  fields: [
    { name: 'field1', type: 'keyword' },
    { name: 'field2', type: 'text' },
  ],
};

const newMapping = {
  version: '2.2',
  fields: [
    { name: 'field1', type: 'text' },     // modified
    { name: 'field3', type: 'integer' },  // à l'index 1, pas "ajouté" mais "modifié" car comparé par index
  ],
};

describe('DiffView', () => {
  it('renders without crashing', () => {
    render(<DiffView oldMapping={oldMapping} newMapping={newMapping} />);
    expect(screen.getByText('Diff des versions')).toBeInTheDocument();
  });

  it('affiche les bons totaux (aucun ajout/suppression, 4 modifs)', () => {
    render(<DiffView oldMapping={oldMapping} newMapping={newMapping} />);
    expect(screen.getByText('+0')).toBeInTheDocument();
    expect(screen.getByText('-0')).toBeInTheDocument();
    expect(screen.getByText('~4')).toBeInTheDocument();
  });

  it('liste les chemins modifiés attendus', () => {
    render(<DiffView oldMapping={oldMapping} newMapping={newMapping} />);
    ['version', 'fields.0.type', 'fields.1.name', 'fields.1.type'].forEach(p =>
      expect(screen.getByText(p)).toBeInTheDocument()
    );
  });

  it('mappings identiques : uniquement des éléments "=" et ~0', () => {
    render(<DiffView oldMapping={oldMapping} newMapping={oldMapping} />);
    // résumé sans changements
    expect(screen.getByText('+0')).toBeInTheDocument();
    expect(screen.getByText('-0')).toBeInTheDocument();
    expect(screen.getByText('~0')).toBeInTheDocument();
    // le composant affiche des entrées "unchanged" (=) au lieu d’un message
    expect(screen.getByText('fields.0.name')).toBeInTheDocument();
    expect(screen.queryByText(/Aucune différence détectée/i)).not.toBeInTheDocument();
  });
});
