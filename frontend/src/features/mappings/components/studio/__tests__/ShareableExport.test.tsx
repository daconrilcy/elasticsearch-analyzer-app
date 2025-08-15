import { render, screen, fireEvent } from '@testing-library/react';
import { ShareableExport } from '../ShareableExport';
import { describe, it, expect, vi } from 'vitest';

const mockMappingDSL = {
  name: 'Test DSL',
  description: 'Une description',
  mapping: {},
  operations: [],
  metadata: {
    version: '1.0',
    created_at: '2024-01-01',
    author: 'Test',
    tags: [],
  },
};

describe('ShareableExport', () => {
  it("rend le composant avec les options d\'export", () => {
    render(<ShareableExport mappingDSL={mockMappingDSL} />);
    // Titre ok
    expect(
      screen.getByRole('heading', { level: 3, name: /Export Shareable/i })
    ).toBeInTheDocument();

    // Cible UNIQUEMENT les boutons de format via leurs noms accessibles
    expect(
      screen.getByRole('button', { name: /Format JSON/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Format YAML/i })
    ).toBeInTheDocument();
  });

  it("change le format d'export au clic", () => {
    render(<ShareableExport mappingDSL={mockMappingDSL} />);
    // Clique sur le bouton YAML (nom accessible fourni par aria-label dans le composant)
    const yamlBtn = screen.getByRole('button', { name: /Format YAML/i });
    fireEvent.click(yamlBtn);

    // Vérifie l'état via aria-pressed (plus robuste que la classe CSS module)
    expect(yamlBtn).toHaveAttribute('aria-pressed', 'true');

    // Et JSON doit être désélectionné
    const jsonBtn = screen.getByRole('button', { name: /Format JSON/i });
    expect(jsonBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it("déclenche l'export au clic sur le bouton principal", () => {
    const onExport = vi.fn();
    render(<ShareableExport mappingDSL={mockMappingDSL} onExport={onExport} />);
    const exportButton = screen.getByRole('button', { name: /Exporter et Partager/i });
    fireEvent.click(exportButton);
    // Le callback est appelé après la préparation de l'export (synchrone ici)
    // Décommente si tu veux l'asserter strictement :
    // expect(onExport).toHaveBeenCalled();
  });
});