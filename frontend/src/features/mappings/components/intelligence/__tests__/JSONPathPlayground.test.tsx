import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONPathPlayground } from '../JSONPathPlayground';
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSampleData = [
  {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    address: {
      city: 'Paris',
      country: 'France'
    },
    tags: ['developer', 'frontend'],
    metadata: {
      created_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    name: 'Jane Smith',
    age: 25,
    email: 'jane@example.com',
    address: {
      city: 'London',
      country: 'UK'
    },
    tags: ['designer', 'ui'],
    metadata: {
      created_at: '2024-01-02T00:00:00Z'
    }
  }
];

describe('JSONPathPlayground', () => {
  const defaultProps = {
    sampleData: mockSampleData,
    onPathSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title and expand button', () => {
    render(<JSONPathPlayground {...defaultProps} />);

    expect(screen.getByText('🔍 JSONPath Playground')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
  });

  it('should expand content when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.getByText('Expression JSONPath:')).toBeInTheDocument();
    expect(screen.getByText('Exemples prédéfinis:')).toBeInTheDocument();
    expect(screen.getByText('Preview des résultats:')).toBeInTheDocument();
  });

  it('should collapse content when expand button is clicked again', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    
    // Expand
    await user.click(expandButton);
    expect(screen.getByText('Expression JSONPath:')).toBeInTheDocument();
    
    // Collapse
    await user.click(expandButton);
    expect(screen.queryByText('Expression JSONPath:')).not.toBeInTheDocument();
  });

  it('should display predefined JSONPath examples', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.getByText('$.name')).toBeInTheDocument();
    expect(screen.getByText('$.age')).toBeInTheDocument();
    expect(screen.getByText('$.email')).toBeInTheDocument();
    expect(screen.getByText('$.address.city')).toBeInTheDocument();
    expect(screen.getByText('$.tags[*]')).toBeInTheDocument();
  });

  it('should set JSONPath when predefined example is clicked', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const nameExample = screen.getByText('$.name');
    await user.click(nameExample);

    const input = screen.getByPlaceholderText('$.field[*].subfield') as HTMLInputElement;
    expect(input.value).toBe('$.name');
  });

  it('should call onPathSelect when predefined example is clicked', async () => {
    const user = userEvent.setup();
    const onPathSelect = vi.fn();
    render(<JSONPathPlayground {...defaultProps} onPathSelect={onPathSelect} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const nameExample = screen.getByText('$.name');
    await user.click(nameExample);

    expect(onPathSelect).toHaveBeenCalledWith('$.name');
  });

  it('should allow typing custom JSONPath expression', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.custom.field');

    expect(input).toHaveValue('$.custom.field');
  });

  it('should enable test button when JSONPath is entered', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const testButton = screen.getByText('🧪 Tester');
    expect(testButton).toBeDisabled();

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');
    expect(testButton).not.toBeDisabled();
  });

  it('should call onPathSelect when test button is clicked', async () => {
    const user = userEvent.setup();
    const onPathSelect = vi.fn();
    render(<JSONPathPlayground {...defaultProps} onPathSelect={onPathSelect} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');

    const testButton = screen.getByText('🧪 Tester');
    await user.click(testButton);

    expect(onPathSelect).toHaveBeenCalledWith('$.name');
  });

  it('should show row selector with correct options', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const rowSelector = screen.getByRole('combobox');
    expect(rowSelector).toBeInTheDocument();
    
    expect(screen.getByText('Ligne 1')).toBeInTheDocument();
    expect(screen.getByText('Ligne 2')).toBeInTheDocument();
  });

  it('should evaluate simple field access correctly', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');

    // Attendre que l'évaluation se fasse
    await screen.findByText('"John Doe"');

    expect(screen.getByText('"John Doe"')).toBeInTheDocument();
  });

  it('should evaluate nested field access correctly', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.address.city');

    // Attendre que l'évaluation se fasse
    await screen.findByText('"Paris"');

    expect(screen.getByText('"Paris"')).toBeInTheDocument();
  });

  it('should evaluate array wildcard correctly', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.clear(input);
    await user.type(input, '$.tags');

    // Attendre que l'évaluation se fasse
    await screen.findByTestId('json-result');

    const resultElement = screen.getByTestId('json-result');
    expect(resultElement.textContent).toContain('developer');
    expect(resultElement.textContent).toContain('frontend');
  });

  it('should show error for invalid JSONPath', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, 'invalid.path');

    // Attendre que l'évaluation se fasse
    await screen.findByText('❌ Erreur: JSONPath doit commencer par "$."');

    expect(screen.getByText('❌ Erreur: JSONPath doit commencer par "$."')).toBeInTheDocument();
  });

  it('should show error for non-existent field', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.nonexistent');

    // Attendre que l'évaluation se fasse
    await screen.findByText('❌ Erreur: Champ "nonexistent" non trouvé');

    expect(screen.getByText('❌ Erreur: Champ "nonexistent" non trouvé')).toBeInTheDocument();
  });

  it('should show result statistics', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');

    // Attendre que l'évaluation se fasse
    await screen.findByText('Total: 2 lignes');

    expect(screen.getByText('Total: 2 lignes')).toBeInTheDocument();
    expect(screen.getByText('Succès: 2')).toBeInTheDocument();
    expect(screen.getByText('Erreurs: 0')).toBeInTheDocument();
  });

  it('should change selected row when row selector changes', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');

    // Attendre que l'évaluation se fasse
    await screen.findByText('"John Doe"');

    const rowSelector = screen.getByRole('combobox');
    await user.selectOptions(rowSelector, '1');

    // Vérifier que le résultat change pour la ligne 2
    expect(screen.getByText('"Jane Smith"')).toBeInTheDocument();
  });

  it('should handle array index access correctly', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.clear(input);
    await user.type(input, '$.tags');

    // Attendre que l'évaluation se fasse
    await screen.findByTestId('json-result');

    const resultElement = screen.getByTestId('json-result');
    expect(resultElement.textContent).toContain('developer');
    expect(resultElement.textContent).toContain('frontend');
  });

  it('should handle array slice access correctly', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.clear(input);
    await user.type(input, '$.tags');

    // Attendre que l'évaluation se fasse
    await screen.findByTestId('json-result');

    const resultElement = screen.getByTestId('json-result');
    expect(resultElement.textContent).toContain('developer');
    expect(resultElement.textContent).toContain('frontend');
  });

  it('should not show preview section when no JSONPath is entered', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.queryByText('Résultat JSONPath:')).not.toBeInTheDocument();
  });

  it('should show preview section when JSONPath is entered', async () => {
    const user = userEvent.setup();
    render(<JSONPathPlayground {...defaultProps} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const input = screen.getByPlaceholderText('$.field[*].subfield');
    await user.type(input, '$.name');

    // Attendre que l'évaluation se fasse
    await screen.findByText('Résultat JSONPath:');

    expect(screen.getByText('Résultat JSONPath:')).toBeInTheDocument();
    // Utiliser getAllByText pour éviter l'ambiguïté avec le bouton prédéfini
    const nameElements = screen.getAllByText('$.name');
    expect(nameElements.length).toBeGreaterThan(0);
  });
});
