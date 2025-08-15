import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MappingWorkbenchV2Demo } from '@features/mappings/demo/MappingWorkbenchV2Demo';

// Mock du composant enfant pour isoler le test au composant de démo
vi.mock('@features/mappings/components/MappingWorkbenchV2', () => ({
  MappingWorkbenchV2: () => <div data-testid="mock-workbench-v2"></div>,
}));

describe('MappingWorkbenchV2Demo', () => {
  it('devrait afficher le titre et la description', () => {
    render(<MappingWorkbenchV2Demo />);
    expect(
      screen.getByText('🎯 Mapping Studio V2.2 - Démonstration')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Interface complète intégrant tous les composants V2.2/
      )
    ).toBeInTheDocument();
  });

  it('devrait rendre le composant MappingWorkbenchV2', () => {
    render(<MappingWorkbenchV2Demo />);
    // On vérifie la présence de notre version simulée (mock) du workbench
    expect(screen.getByTestId('mock-workbench-v2')).toBeInTheDocument();
  });

  it("devrait afficher la section d'information avec les fonctionnalités V2.2", () => {
    render(<MappingWorkbenchV2Demo />);
    // On vérifie le titre de la section
    expect(
      screen.getByText('✨ Fonctionnalités V2.2 intégrées :')
    ).toBeInTheDocument();

    // On vérifie la présence de chaque fonctionnalité dans la liste
    expect(screen.getByText(/SchemaBanner/)).toBeInTheDocument();
    expect(screen.getByText(/TemplatesMenu/)).toBeInTheDocument();
    expect(screen.getByText(/ShortcutsHelp/)).toBeInTheDocument();
    expect(screen.getByText(/PipelineDnD/)).toBeInTheDocument();
    expect(screen.getByText(/DiffView/)).toBeInTheDocument();
    expect(screen.getByText(/Performance/)).toBeInTheDocument();
    expect(screen.getByText(/Responsive/)).toBeInTheDocument();
  });
});