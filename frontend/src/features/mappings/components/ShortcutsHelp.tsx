import React, { useState } from 'react';
import { useShortcuts } from '../hooks/useShortcuts';
import styles from './ShortcutsHelp.module.scss';

export const ShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isShortcutActive } = useShortcuts({});

  const shortcuts = [
    {
      key: 'Enter',
      modifier: 'cmd',
      description: 'Exécuter l\'action (validation, dry-run, etc.)',
      action: 'run'
    },
    {
      key: 'S',
      modifier: 'cmd',
      description: 'Sauvegarder/Exporter le mapping',
      action: 'save'
    }
  ];

  const getModifierLabel = (modifier: string) => {
    return isShortcutActive(modifier, modifier as 'cmd' | 'ctrl') ? '⌘' : 'Ctrl';
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Afficher l'aide des raccourcis clavier"
      >
        ⌨️ Raccourcis
      </button>

      {isOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Raccourcis clavier</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Fermer l'aide"
              >
                ×
              </button>
            </div>

            <div className={styles.shortcutsList}>
              {shortcuts.map((shortcut) => (
                <div key={shortcut.action} className={styles.shortcut}>
                  <div className={styles.shortcutKey}>
                    <kbd>{getModifierLabel(shortcut.modifier)}</kbd>
                    <span>+</span>
                    <kbd>{shortcut.key}</kbd>
                  </div>
                  <div className={styles.shortcutDescription}>
                    {shortcut.description}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <p>
                <strong>Note:</strong> Sur Mac, utilisez ⌘. Sur Windows/Linux, utilisez Ctrl.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutsHelp;
