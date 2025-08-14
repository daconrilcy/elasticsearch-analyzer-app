import { render, screen } from '@testing-library/react';
import { PipelineDnD } from '../PipelineDnD';

const mockOperations = [
  { id: '1', type: 'trim', config: {} },
  { id: '2', type: 'cast', config: { to: 'integer' } },
];

const renderOperation = (operation: any) => (
  <div key={operation.id}>{operation.type}</div>
);

describe('PipelineDnD', () => {
  it('renders operations', () => {
    render(
      <PipelineDnD
        operations={mockOperations}
        onChange={() => {}}
        renderOperation={renderOperation}
      />
    );
    expect(screen.getByText('trim')).toBeInTheDocument();
    expect(screen.getByText('cast')).toBeInTheDocument();
  });

  it('shows empty state when no operations are provided', () => {
    render(
      <PipelineDnD
        operations={[]}
        onChange={() => {}}
        renderOperation={renderOperation}
      />
    );
    expect(screen.getByText('Aucune opération dans le pipeline')).toBeInTheDocument();
  });
});