import { render, screen } from '@testing-library/react';
import { ToastsContainer } from '../ToastsContainer';
import { useToasts } from '../../hooks/useToasts';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../hooks/useToasts');

describe('ToastsContainer', () => {
  it('renders toasts', () => {
    (useToasts as jest.Mock).mockReturnValue({
      toasts: [{ id: '1', type: 'success', message: 'Success message' }],
      remove: vi.fn(),
    });
    render(<ToastsContainer />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('does not render when there are no toasts', () => {
    (useToasts as jest.Mock).mockReturnValue({
      toasts: [],
      remove: vi.fn(),
    });
    const { container } = render(<ToastsContainer />);
    expect(container.firstChild).toBeNull();
  });
});