import { render, screen, fireEvent } from '@testing-library/react';
import { MicroIterationsDemo } from '@features/mappings/demo/MicroIterationsDemo';
import { describe, it, expect } from 'vitest';

describe('MicroIterationsDemo', () => {
  it('rend le composant avec les onglets', () => {
    render(<MicroIterationsDemo />);
    expect(screen.getByText('🚀 Micro-itérations V2.2.1 - Démonstration')).toBeInTheDocument();
    expect(screen.getByText('🔍 Diff Riche')).toBeInTheDocument();
    expect(screen.getByText('🚀 Presets')).toBeInTheDocument();
  });

  it('change d\'onglet au clic', () => {
    render(<MicroIterationsDemo />);
    const presetsTab = screen.getByText('🚀 Presets');
    fireEvent.click(presetsTab);
    expect(screen.getByText('🚀 Templates Prêts à l\'Emploi')).toBeInTheDocument();
  });
});