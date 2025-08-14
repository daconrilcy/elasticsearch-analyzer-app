import { render, screen } from '@testing-library/react';
import { DocsPreviewVirtualized } from '../DocsPreviewVirtualized';

const mockDocuments = [
  { _id: 'doc1', _source: { message: 'Hello World 1' } },
  { _id: 'doc2', _source: { message: 'Hello World 2' } },
  { _id: 'doc3', _source: { message: 'Hello World 3' } },
];

describe('DocsPreviewVirtualized', () => {
  it('renders the component with documents', () => {
    render(<DocsPreviewVirtualized documents={mockDocuments} />);
    expect(screen.getByText('Prévisualisation des documents')).toBeInTheDocument();
    expect(screen.getByText('doc1')).toBeInTheDocument();
    expect(screen.getByText('doc2')).toBeInTheDocument();
    expect(screen.getByText('doc3')).toBeInTheDocument();
  });

  it('shows the correct count of documents', () => {
    render(<DocsPreviewVirtualized documents={mockDocuments} />);
    expect(screen.getByText('3 / 3 documents')).toBeInTheDocument();
  });

  it('displays an empty state when there are no documents', () => {
    render(<DocsPreviewVirtualized documents={[]} />);
    expect(screen.getByText('Aucun document à afficher')).toBeInTheDocument();
  });
});