import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedDiffViewDemo } from '../UnifiedDiffViewDemo';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock du composant UnifiedDiffView pour éviter les dépendances complexes
vi.mock('../../components/studio/UnifiedDiffView', () => ({
  UnifiedDiffView: ({ mode, showInline, showUnchanged, className }: any) => (
    <div data-testid="unified-diff-view" className={className}>
      <div data-testid="mock-mode">Mode: {mode}</div>
      <div data-testid="mock-inline">Inline: {showInline ? 'true' : 'false'}</div>
      <div data-testid="mock-unchanged">Unchanged: {showUnchanged ? 'true' : 'false'}</div>
    </div>
  )
}));

describe('UnifiedDiffViewDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu de Base', () => {
    it('rend le composant avec le titre principal', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('🔍 Démonstration UnifiedDiffView')).toBeInTheDocument();
      expect(screen.getByText(/Composant unifié qui combine les fonctionnalités/)).toBeInTheDocument();
    });

    it('affiche la section de sélection du mode', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('🎛️ Sélection du Mode')).toBeInTheDocument();
      expect(screen.getByText('📊 Mode Simple')).toBeInTheDocument();
      expect(screen.getByText('🚀 Mode Avancé')).toBeInTheDocument();
    });
  });

  describe('Sélection du Mode', () => {
    it('commence en mode avancé par défaut', () => {
      render(<UnifiedDiffViewDemo />);
      
      const advancedButton = screen.getByText('🚀 Mode Avancé');
      const simpleButton = screen.getByText('📊 Mode Simple');
      
      expect(advancedButton).toHaveClass('_active_bf756c');
      expect(simpleButton).not.toHaveClass('_active_bf756c');
    });

    it('permet de basculer vers le mode simple', () => {
      render(<UnifiedDiffViewDemo />);
      
      const simpleButton = screen.getByText('📊 Mode Simple');
      fireEvent.click(simpleButton);
      
      expect(simpleButton).toHaveClass('_active_bf756c');
      expect(screen.getByText('Mode: simple')).toBeInTheDocument();
    });

    it('permet de basculer vers le mode avancé', () => {
      render(<UnifiedDiffViewDemo />);
      
      // D'abord basculer vers simple
      const simpleButton = screen.getByText('📊 Mode Simple');
      fireEvent.click(simpleButton);
      
      // Puis basculer vers avancé
      const advancedButton = screen.getByText('🚀 Mode Avancé');
      fireEvent.click(advancedButton);
      
      expect(advancedButton).toHaveClass('_active_bf756c');
      expect(screen.getByText('Mode: advanced')).toBeInTheDocument();
    });

    it('met à jour la description du mode', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Mode avancé par défaut
      expect(screen.getByText(/Diff riche avec jsondiffpatch/)).toBeInTheDocument();
      
      // Basculer vers simple
      const simpleButton = screen.getByText('📊 Mode Simple');
      fireEvent.click(simpleButton);
      
      expect(screen.getByText(/Comparaison basique native React/)).toBeInTheDocument();
    });
  });

  describe('Contrôles Avancés', () => {
    it('affiche les contrôles avancés uniquement en mode avancé', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Mode avancé par défaut
      expect(screen.getByText('⚙️ Contrôles Avancés')).toBeInTheDocument();
      expect(screen.getByText('Affichage inline')).toBeInTheDocument();
      expect(screen.getByText('Afficher les champs inchangés')).toBeInTheDocument();
      
      // Basculer vers simple
      const simpleButton = screen.getByText('📊 Mode Simple');
      fireEvent.click(simpleButton);
      
      expect(screen.queryByText('⚙️ Contrôles Avancés')).not.toBeInTheDocument();
      expect(screen.queryByText('Affichage inline')).not.toBeInTheDocument();
      expect(screen.queryByText('Afficher les champs inchangés')).not.toBeInTheDocument();
    });

    it('permet de basculer l\'affichage inline', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Prendre le premier checkbox (celui de la demo)
      const inlineCheckboxes = screen.getAllByLabelText('Affichage inline');
      const inlineCheckbox = inlineCheckboxes[0];
      expect(inlineCheckbox).not.toBeChecked();
      
      fireEvent.click(inlineCheckbox);
      expect(inlineCheckbox).toBeChecked();
    });

    it('permet d\'afficher les champs inchangés', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Prendre le premier checkbox (celui de la demo)
      const unchangedCheckboxes = screen.getAllByLabelText('Afficher les champs inchangés');
      const unchangedCheckbox = unchangedCheckboxes[0];
      expect(unchangedCheckbox).not.toBeChecked();
      
      fireEvent.click(unchangedCheckbox);
      expect(unchangedCheckbox).toBeChecked();
    });
  });

  describe('Informations des Mappings', () => {
    it('affiche les deux mappings de test', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('📋 Mapping 1 (Original)')).toBeInTheDocument();
      expect(screen.getByText('📋 Mapping 2 (Modifié)')).toBeInTheDocument();
    });

    it('affiche les détails des mappings', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Mapping 1
      expect(screen.getAllByText(/Nom :/)).toHaveLength(2); // 2 mappings
      expect(screen.getAllByText(/Version :/)).toHaveLength(2); // 2 mappings
      expect(screen.getAllByText(/Champs :/)).toHaveLength(2); // 2 mappings
      
      // Vérifie que les valeurs sont affichées
      expect(screen.getByText('Mapping Test 1')).toBeInTheDocument();
      expect(screen.getByText('2.1')).toBeInTheDocument();
    });

    it('affiche le JSON des mappings', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Vérifie que le JSON est affiché
      expect(screen.getAllByText(/Mapping Test 1/)).toHaveLength(2); // 1 dans les détails + 1 dans le JSON
      expect(screen.getAllByText(/Mapping Test 2/)).toHaveLength(2); // 1 dans les détails + 1 dans le JSON
    });
  });

  describe('Section de Diff', () => {
    it('affiche la section de comparaison', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('🔍 Résultat de la Comparaison')).toBeInTheDocument();
      expect(screen.getByText(/Mode actuel :/)).toBeInTheDocument();
    });

    it('affiche le composant UnifiedDiffView', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByTestId('unified-diff-view')).toBeInTheDocument();
    });

    it('passe les bonnes props au composant UnifiedDiffView', () => {
      render(<UnifiedDiffViewDemo />);
      
      const diffView = screen.getByTestId('unified-diff-view');
      expect(diffView).toBeInTheDocument();
      
      // Vérifie que les props sont passées correctement
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: advanced');
      expect(screen.getByTestId('mock-inline')).toHaveTextContent('Inline: false');
      expect(screen.getByTestId('mock-unchanged')).toHaveTextContent('Unchanged: false');
    });

    it('met à jour les props lors du changement de mode', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Mode avancé par défaut
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: advanced');
      
      // Basculer vers simple
      const simpleButton = screen.getByText('📊 Mode Simple');
      fireEvent.click(simpleButton);
      
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: simple');
    });

    it('met à jour les props lors du changement des contrôles', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Basculer l'affichage inline
      const inlineCheckbox = screen.getByLabelText('Affichage inline');
      fireEvent.click(inlineCheckbox);
      
      expect(screen.getByTestId('mock-inline')).toHaveTextContent('Inline: true');
      
      // Basculer l'affichage des champs inchangés
      const unchangedCheckbox = screen.getByLabelText('Afficher les champs inchangés');
      fireEvent.click(unchangedCheckbox);
      
      expect(screen.getByTestId('mock-unchanged')).toHaveTextContent('Unchanged: true');
    });
  });

  describe('Fonctionnalités', () => {
    it('affiche la section des fonctionnalités', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('✨ Fonctionnalités du Composant Unifié')).toBeInTheDocument();
    });

    it('affiche les 4 fonctionnalités principales', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('🔄 Basculement de Mode')).toBeInTheDocument();
      expect(screen.getByText('📊 Statistiques Adaptatives')).toBeInTheDocument();
      expect(screen.getByText('⚡ Performance Optimisée')).toBeInTheDocument();
      expect(screen.getByText('🎨 Interface Cohérente')).toBeInTheDocument();
    });

    it('affiche les descriptions des fonctionnalités', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText(/Changez dynamiquement entre le mode simple et avancé/)).toBeInTheDocument();
      expect(screen.getByText(/Les statistiques s'adaptent automatiquement/)).toBeInTheDocument();
      expect(screen.getByText(/Mode simple pour les comparaisons rapides/)).toBeInTheDocument();
      expect(screen.getByText(/Design unifié qui maintient la cohérence/)).toBeInTheDocument();
    });
  });

  describe('Guide d\'Utilisation', () => {
    it('affiche la section du guide d\'utilisation', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('📖 Guide d\'Utilisation')).toBeInTheDocument();
    });

    it('affiche les deux modes d\'utilisation', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getByText('Mode Simple')).toBeInTheDocument();
      expect(screen.getByText('Mode Avancé')).toBeInTheDocument();
    });

    it('affiche les avantages du mode simple', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getAllByText(/✅/)).toHaveLength(4);
      expect(screen.getByText(/Rapide/)).toBeInTheDocument();
      expect(screen.getByText(/Léger/)).toBeInTheDocument();
      expect(screen.getAllByText(/Simple/)).toHaveLength(3); // 1 bouton + 1 titre + 1 dans la liste
    });

    it('affiche les avantages du mode avancé', () => {
      render(<UnifiedDiffViewDemo />);
      
      expect(screen.getAllByText(/🚀/)).toHaveLength(5); // 4 dans la liste + 1 dans le bouton
      expect(screen.getByText(/Puissant/)).toBeInTheDocument();
      expect(screen.getByText(/Précis/)).toBeInTheDocument();
      expect(screen.getByText(/Configurable/)).toBeInTheDocument();
    });
  });

  describe('Interactions Utilisateur', () => {
    it('permet de basculer entre les modes plusieurs fois', () => {
      render(<UnifiedDiffViewDemo />);
      
      const simpleButton = screen.getByText('📊 Mode Simple');
      const advancedButton = screen.getByText('🚀 Mode Avancé');
      
      // Premier basculement
      fireEvent.click(simpleButton);
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: simple');
      
      // Retour au mode avancé
      fireEvent.click(advancedButton);
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: advanced');
      
      // Encore en mode simple
      fireEvent.click(simpleButton);
      expect(screen.getByTestId('mock-mode')).toHaveTextContent('Mode: simple');
    });

    it('permet de combiner les contrôles avancés', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Prendre les premiers checkboxes (ceux de la demo)
      const inlineCheckboxes = screen.getAllByLabelText('Affichage inline');
      const unchangedCheckboxes = screen.getAllByLabelText('Afficher les champs inchangés');
      const inlineCheckbox = inlineCheckboxes[0];
      const unchangedCheckbox = unchangedCheckboxes[0];
      
      // Activer les deux contrôles
      fireEvent.click(inlineCheckbox);
      fireEvent.click(unchangedCheckbox);
      
      expect(inlineCheckbox).toBeChecked();
      expect(unchangedCheckbox).toBeChecked();
      
      // Vérifier que les props sont mises à jour
      expect(screen.getByTestId('mock-inline')).toHaveTextContent('Inline: true');
      expect(screen.getByTestId('mock-unchanged')).toHaveTextContent('Unchanged: true');
    });
  });

  describe('Responsive Design', () => {
    it('gère les écrans de petite taille', () => {
      // Simule un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      render(<UnifiedDiffViewDemo />);
      
      // Le composant doit toujours être fonctionnel
      expect(screen.getByText('🔍 Démonstration UnifiedDiffView')).toBeInTheDocument();
      expect(screen.getByText('🎛️ Sélection du Mode')).toBeInTheDocument();
    });

    it('gère les écrans de très petite taille', () => {
      // Simule un très petit écran
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480
      });
      
      render(<UnifiedDiffViewDemo />);
      
      // Le composant doit toujours être fonctionnel
      expect(screen.getByText('🔍 Démonstration UnifiedDiffView')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('utilise des labels appropriés pour les contrôles', () => {
      render(<UnifiedDiffViewDemo />);
      
      // Il y a deux contrôles avec le même label (un dans la demo, un dans UnifiedDiffView)
      const inlineCheckboxes = screen.getAllByLabelText('Affichage inline');
      const unchangedCheckboxes = screen.getAllByLabelText('Afficher les champs inchangés');
      
      expect(inlineCheckboxes).toHaveLength(1); // Seulement dans la demo car le mock n'affiche pas les contrôles
      expect(unchangedCheckboxes).toHaveLength(1); // Seulement dans la demo car le mock n'affiche pas les contrôles
    });

    it('utilise des boutons sémantiques', () => {
      render(<UnifiedDiffViewDemo />);
      
      const simpleButton = screen.getByRole('button', { name: /📊 Mode Simple/ });
      const advancedButton = screen.getByRole('button', { name: /🚀 Mode Avancé/ });
      
      expect(simpleButton).toBeInTheDocument();
      expect(advancedButton).toBeInTheDocument();
    });

    it('utilise des titres hiérarchiques appropriés', () => {
      render(<UnifiedDiffViewDemo />);
      
      const mainTitle = screen.getByRole('heading', { level: 1 });
      const sectionTitles = screen.getAllByRole('heading', { level: 3 });
      
      expect(mainTitle).toBeInTheDocument();
      expect(sectionTitles).toHaveLength(7); // 7 sections principales (le mock UnifiedDiffView n'ajoute pas de titres)
    });
  });
});
