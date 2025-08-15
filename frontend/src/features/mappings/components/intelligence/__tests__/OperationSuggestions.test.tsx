import { render, screen } from '@testing-library/react';
import { OperationSuggestions } from '../OperationSuggestions';
import { describe, it, expect } from 'vitest';

const mockInferredFields = [
  {
    field: 'email',
    suggested_type: 'email',
    confidence: 0.9,
    sample_values: ['test@example.com'],
    reasoning: 'Format email détecté',
  },
];

describe('OperationSuggestions', () => {
  it('rend le composant avec des suggestions', () => {
    render(<OperationSuggestions inferredFields={mockInferredFields} />);
    expect(screen.getByText('💡 Suggestions d\'Opérations Intelligentes')).toBeInTheDocument();
    // Basé sur le type 'email', une suggestion de validation devrait apparaître
    expect(screen.getByText(/Validation Email/)).toBeInTheDocument();
  });

  it('affiche un message lorsqu\'il n\'y a aucune suggestion', () => {
    render(<OperationSuggestions inferredFields={[]} />);
    expect(screen.getByText('Aucune suggestion trouvée')).toBeInTheDocument();
  });
});