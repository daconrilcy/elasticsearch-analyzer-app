import { render, screen, fireEvent } from '@testing-library/react';
import { TemplatesMenu } from '../TemplatesMenu';
import { describe, it, expect, vi } from 'vitest';

describe('TemplatesMenu', () => {
  it('opens and shows templates on click', () => {
    const onApply = vi.fn();
    render(<TemplatesMenu onApply={onApply} />);
    
    const button = screen.getByText('📋 Templates DSL');
    fireEvent.click(button);

    expect(screen.getByText('Templates disponibles')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Adresses')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('calls onApply with the correct template', () => {
    const onApply = vi.fn();
    render(<TemplatesMenu onApply={onApply} />);
    
    fireEvent.click(screen.getByText('📋 Templates DSL'));
    fireEvent.click(screen.getByText('Contacts'));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ name: 'Contacts' }));
  });
});