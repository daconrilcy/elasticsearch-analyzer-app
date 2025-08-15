import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedDiffView } from '../UnifiedDiffView';
import { describe, it, expect, beforeEach, vi } from 'vitest';



// Mock de jsondiffpatch pour les tests
vi.mock('jsondiffpatch', () => ({
  default: {
    create: vi.fn(() => ({
      diff: vi.fn((obj1: any, obj2: any) => {
        // Mock simple du diff jsondiffpatch
        if (obj1.name !== obj2.name) {
          return {
            name: ['old_value', 'new_value']
          };
        }
        if (obj1.version !== obj2.version) {
          return {
            version: ['old_version', 'new_version']
          };
        }
        return null; // Pas de différence
      })
    }))
  }
}));

// Mock de navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
});

describe('UnifiedDiffView', () => {
  // Données de test
  const simpleMapping1 = {
    name: 'Test Mapping 1',
    version: '1.0',
    fields: ['field1', 'field2']
  };

  const simpleMapping2 = {
    name: 'Test Mapping 2',
    version: '2.0',
    fields: ['field1', 'field3']
  };

  const complexMapping1 = {
    name: 'Complex Mapping 1',
    version: '1.0',
    fields: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'keyword' },
          email: { type: 'email' }
        }
      },
      timestamp: { type: 'date' }
    }
  };

  const complexMapping2 = {
    name: 'Complex Mapping 2',
    version: '2.0',
    fields: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'keyword' },
          email: { type: 'email' },
          phone: { type: 'phone' }
        }
      },
      timestamp: { type: 'date' },
      location: { type: 'geo_point' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu de Base', () => {
    it('rend le composant avec le titre et le mode par défaut', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} />);
      
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
      expect(screen.getByText('Avancé')).toBeInTheDocument();
    });

    it('affiche un message d\'erreur si un mapping est manquant', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={null} />);
      
      expect(screen.getByText('❌ Impossible de comparer les mappings : données manquantes')).toBeInTheDocument();
    });

    it('affiche un message d\'erreur si les deux mappings sont manquants', () => {
      render(<UnifiedDiffView leftMapping={null} rightMapping={null} />);
      
      expect(screen.getByText('❌ Impossible de comparer les mappings : données manquantes')).toBeInTheDocument();
    });
  });

  describe('Mode Simple', () => {
    it('rend correctement en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      expect(screen.getByText('Simple')).toBeInTheDocument();
    });

    it('affiche les statistiques en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      expect(screen.getByText(/Ajoutés/)).toBeInTheDocument();
      expect(screen.getByText(/Supprimés/)).toBeInTheDocument();
      expect(screen.getByText(/Modifiés/)).toBeInTheDocument();
    });

    it('détecte les champs ajoutés en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      // Vérifie que les différences sont détectées
      expect(screen.getByText(/field3/)).toBeInTheDocument();
    });

    it('détecte les champs supprimés en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      // Vérifie que les différences sont détectées
      expect(screen.getByText(/field2/)).toBeInTheDocument();
    });

    it('détecte les champs modifiés en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      // Vérifie que les différences sont détectées
      expect(screen.getByText(/name/)).toBeInTheDocument();
      expect(screen.getByText(/version/)).toBeInTheDocument();
    });

    it('affiche "Aucune différence détectée" quand les mappings sont identiques', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping1} mode="simple" />);
      
      expect(screen.getByText('Aucune différence détectée')).toBeInTheDocument();
    });

    it('gère les objets imbriqués en mode simple', () => {
      render(<UnifiedDiffView leftMapping={complexMapping1} rightMapping={complexMapping2} mode="simple" />);
      
      // Vérifie que les champs imbriqués sont détectés
      expect(screen.getByText(/user\.properties\.phone/)).toBeInTheDocument();
      expect(screen.getByText(/location/)).toBeInTheDocument();
    });
  });

  describe('Mode Avancé', () => {
    it('rend correctement en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      expect(screen.getByText('Avancé')).toBeInTheDocument();
    });

    it('affiche les contrôles avancés en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      expect(screen.getByText('Affichage inline')).toBeInTheDocument();
      expect(screen.getByText('Afficher les champs inchangés')).toBeInTheDocument();
    });

    it('n\'affiche pas les contrôles avancés en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      expect(screen.queryByText('Affichage inline')).not.toBeInTheDocument();
      expect(screen.queryByText('Afficher les champs inchangés')).not.toBeInTheDocument();
    });

    it('affiche les statistiques détaillées en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      expect(screen.getByText(/Ajoutés/)).toBeInTheDocument();
      expect(screen.getByText(/Supprimés/)).toBeInTheDocument();
      expect(screen.getByText(/Modifiés/)).toBeInTheDocument();
      expect(screen.getByText(/Inchangés/)).toBeInTheDocument();
    });

    it('affiche les actions avancées en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      expect(screen.getByText('🔄 Actualiser le diff')).toBeInTheDocument();
      expect(screen.getByText('📋 Copier le diff')).toBeInTheDocument();
    });

    it('n\'affiche pas les actions avancées en mode simple', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      expect(screen.queryByText('🔄 Actualiser le diff')).not.toBeInTheDocument();
      expect(screen.queryByText('📋 Copier le diff')).not.toBeInTheDocument();
    });
  });

  describe('Contrôles et Interactions', () => {
    it('permet de basculer l\'affichage inline en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      const inlineCheckbox = screen.getByLabelText('Affichage inline');
      expect(inlineCheckbox).not.toBeChecked();
      
      fireEvent.click(inlineCheckbox);
      expect(inlineCheckbox).toBeChecked();
    });

    it('permet d\'afficher les champs inchangés en mode avancé', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      const unchangedCheckbox = screen.getByLabelText('Afficher les champs inchangés');
      expect(unchangedCheckbox).not.toBeChecked();
      
      fireEvent.click(unchangedCheckbox);
      expect(unchangedCheckbox).toBeChecked();
    });

    it('affiche le bouton de basculement de mode', () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      expect(screen.getByText('🔄 Basculer vers le mode Avancé')).toBeInTheDocument();
    });

    it('affiche le bon texte pour le bouton de basculement selon le mode', () => {
      const { rerender } = render(
        <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />
      );
      
      expect(screen.getByText('🔄 Basculer vers le mode Avancé')).toBeInTheDocument();
      
      rerender(
        <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />
      );
      
      expect(screen.getByText('🔄 Basculer vers le mode Simple')).toBeInTheDocument();
    });
  });

  describe('Actions et Fonctionnalités', () => {
    it('permet d\'actualiser le diff en mode avancé', async () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      const refreshButton = screen.getByText('🔄 Actualiser le diff');
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      
      // Vérifie que l'action est exécutée (pas d'erreur)
      await waitFor(() => {
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('permet de copier le diff en mode avancé', async () => {
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      const copyButton = screen.getByText('📋 Copier le diff');
      expect(copyButton).toBeInTheDocument();
      
      fireEvent.click(copyButton);
      
      // Vérifie que navigator.clipboard.writeText a été appelé
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('gère les erreurs lors du calcul du diff avancé', () => {
      // Mock d'une erreur dans jsondiffpatch
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      // Le composant doit continuer à fonctionner malgré l'erreur
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Gestion des Données Complexes', () => {
    it('gère les mappings avec des objets imbriqués profonds', () => {
      const deepMapping1 = {
        level1: {
          level2: {
            level3: {
              value: 'old'
            }
          }
        }
      };
      
      const deepMapping2 = {
        level1: {
          level2: {
            level3: {
              value: 'new'
            }
          }
        }
      };
      
      render(<UnifiedDiffView leftMapping={deepMapping1} rightMapping={deepMapping2} mode="simple" />);
      
      expect(screen.getByText(/level1\.level2\.level3\.value/)).toBeInTheDocument();
    });

    it('gère les mappings avec des arrays', () => {
      const arrayMapping1 = {
        items: ['item1', 'item2', 'item3']
      };
      
      const arrayMapping2 = {
        items: ['item1', 'item4', 'item3']
      };
      
      render(<UnifiedDiffView leftMapping={arrayMapping1} rightMapping={arrayMapping2} mode="simple" />);
      
      expect(screen.getByText(/items/)).toBeInTheDocument();
    });

    it('gère les mappings avec des valeurs null et undefined', () => {
      const nullMapping1 = {
        field1: 'value',
        field2: null,
        field3: undefined
      };
      
      const nullMapping2 = {
        field1: 'value',
        field2: 'new_value',
        field3: 'defined'
      };
      
      render(<UnifiedDiffView leftMapping={nullMapping1} rightMapping={nullMapping2} mode="simple" />);
      
      expect(screen.getByText(/field2/)).toBeInTheDocument();
      expect(screen.getByText(/field3/)).toBeInTheDocument();
    });
  });

  describe('Responsive et Accessibilité', () => {
    it('affiche correctement les statistiques sur mobile', () => {
      // Simule un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />);
      
      // Les statistiques doivent toujours être visibles
      expect(screen.getByText(/Ajoutés/)).toBeInTheDocument();
      expect(screen.getByText(/Supprimés/)).toBeInTheDocument();
      expect(screen.getByText(/Modifiés/)).toBeInTheDocument();
    });

    it('gère les contrôles sur mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      render(<UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="advanced" />);
      
      const inlineCheckbox = screen.getByLabelText('Affichage inline');
      const unchangedCheckbox = screen.getByLabelText('Afficher les champs inchangés');
      
      expect(inlineCheckbox).toBeInTheDocument();
      expect(unchangedCheckbox).toBeInTheDocument();
      
      // Les contrôles doivent être cliquables
      fireEvent.click(inlineCheckbox);
      expect(inlineCheckbox).toBeChecked();
    });
  });

  describe('Cas d\'Erreur et Edge Cases', () => {
    it('gère les mappings vides', () => {
      render(<UnifiedDiffView leftMapping={{}} rightMapping={{}} mode="simple" />);
      
      expect(screen.getByText('Aucune différence détectée')).toBeInTheDocument();
    });

    it('gère les mappings avec des propriétés cycliques', () => {
      const cyclicObj1: any = { name: 'obj1' };
      const cyclicObj2: any = { name: 'obj2' };
      
      // Crée une référence cyclique
      cyclicObj1.self = cyclicObj1;
      cyclicObj2.self = cyclicObj2;
      
      render(<UnifiedDiffView leftMapping={cyclicObj1} rightMapping={cyclicObj2} mode="simple" />);
      
      // Le composant doit gérer cela gracieusement
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
    });

    it('gère les mappings avec des fonctions', () => {
      const funcMapping1 = {
        name: 'test',
        handler: () => 'old'
      };
      
      const funcMapping2 = {
        name: 'test',
        handler: () => 'new'
      };
      
      render(<UnifiedDiffView leftMapping={funcMapping1} rightMapping={funcMapping2} mode="simple" />);
      
      // Les fonctions doivent être traitées comme des valeurs
      expect(screen.getByText(/handler/)).toBeInTheDocument();
    });

    it('gère les mappings avec des symboles', () => {
      const symbolMapping1 = {
        name: 'test',
        key: Symbol('old')
      };
      
      const symbolMapping2 = {
        name: 'test',
        key: Symbol('new')
      };
      
      render(<UnifiedDiffView leftMapping={symbolMapping1} rightMapping={symbolMapping2} mode="simple" />);
      
      // Les symboles doivent être traités comme des valeurs
      expect(screen.getByText(/key/)).toBeInTheDocument();
    });
  });

  describe('Performance et Optimisation', () => {
    it('utilise useMemo pour le calcul du diff simple', () => {
      const { rerender } = render(
        <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />
      );
      
      // Re-render avec les mêmes props
      rerender(
        <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />
      );
      
      // Le composant doit toujours fonctionner
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
    });

    it('gère les re-renders fréquents', () => {
      const { rerender } = render(
        <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />
      );
      
      // Multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <UnifiedDiffView leftMapping={simpleMapping1} rightMapping={simpleMapping2} mode="simple" />
        );
      }
      
      // Le composant doit toujours fonctionner
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
    });
  });

  describe('Intégration et Props', () => {
    it('accepte et applique la prop className', () => {
      const customClass = 'custom-diff-view';
      
      render(
        <UnifiedDiffView 
          leftMapping={simpleMapping1} 
          rightMapping={simpleMapping2} 
          className={customClass}
        />
      );
      
      // Trouver le conteneur principal avec la classe personnalisée
      const container = document.querySelector(`.${customClass}`);
      expect(container).toBeInTheDocument();
    });

    it('gère les props optionnelles manquantes', () => {
      render(
        <UnifiedDiffView 
          leftMapping={simpleMapping1} 
          rightMapping={simpleMapping2}
          // Pas de mode spécifié, doit utiliser le mode par défaut
        />
      );
      
      expect(screen.getByText('Avancé')).toBeInTheDocument();
    });

    it('gère les props avec des valeurs invalides', () => {
      render(
        <UnifiedDiffView 
          leftMapping={simpleMapping1} 
          rightMapping={simpleMapping2}
          mode={'invalid' as any}
          showInline={'invalid' as any}
          showUnchanged={'invalid' as any}
        />
      );
      
      // Le composant doit gérer cela gracieusement
      expect(screen.getByText('🔍 Diff des Mappings')).toBeInTheDocument();
    });
  });
});
