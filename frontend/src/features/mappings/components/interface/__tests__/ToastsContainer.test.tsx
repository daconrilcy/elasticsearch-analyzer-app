import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock du hook useToasts
vi.mock('../../../hooks/useToasts', () => ({
  useToasts: vi.fn(),
}));

// Import du mock après vi.mock
import { useToasts } from '../../../hooks/useToasts';
import { ToastsContainer } from '../ToastsContainer';

describe('ToastsContainer', () => {
  const mockUseToasts = vi.mocked(useToasts);
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toasts', () => {
    mockUseToasts.mockReturnValue({
      toasts: [{ id: '1', type: 'success', message: 'Success message' }],
      remove: mockRemove,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      clear: vi.fn(),
    });
    
    render(<ToastsContainer />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('does not render when there are no toasts', () => {
    mockUseToasts.mockReturnValue({
      toasts: [],
      remove: mockRemove,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      clear: vi.fn(),
    });
    
    const { container } = render(<ToastsContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders different toast types with correct icons', () => {
    mockUseToasts.mockReturnValue({
      toasts: [
        { id: '1', type: 'success', message: 'Success message' },
        { id: '2', type: 'error', message: 'Error message' },
        { id: '3', type: 'info', message: 'Info message' },
      ],
      remove: mockRemove,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      clear: vi.fn(),
    });
    
    render(<ToastsContainer />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('calls remove when close button is clicked', () => {
    mockUseToasts.mockReturnValue({
      toasts: [{ id: '1', type: 'success', message: 'Success message' }],
      remove: mockRemove,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      clear: vi.fn(),
    });
    
    render(<ToastsContainer />);
    
    const closeButton = screen.getByRole('button', { name: 'Fermer la notification' });
    fireEvent.click(closeButton);
    
    expect(mockRemove).toHaveBeenCalledWith('1');
  });

  it('renders multiple toasts correctly', () => {
    mockUseToasts.mockReturnValue({
      toasts: [
        { id: '1', type: 'success', message: 'First toast' },
        { id: '2', type: 'error', message: 'Second toast' },
      ],
      remove: mockRemove,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      clear: vi.fn(),
    });
    
    render(<ToastsContainer />);
    
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    
    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(2);
  });
});