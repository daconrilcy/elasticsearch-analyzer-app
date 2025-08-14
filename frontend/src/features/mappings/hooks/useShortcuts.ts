import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onRun?: () => void;
  onExport?: () => void;
  onSave?: () => void;
}

export function useShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modifierKey) return;

    switch (event.key) {
      case 'Enter':
        if (handlers.onRun) {
          event.preventDefault();
          handlers.onRun();
        }
        break;

      case 's':
        if (handlers.onSave || handlers.onExport) {
          event.preventDefault();
          if (handlers.onSave) {
            handlers.onSave();
          } else if (handlers.onExport) {
            handlers.onExport();
          }
        }
        break;

      default:
        break;
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Fonction utilitaire pour vérifier si un raccourci est actif
    isShortcutActive: (key: string, modifier: 'cmd' | 'ctrl' = 'ctrl') => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const expectedModifier = isMac ? 'cmd' : 'ctrl';
      return modifier === expectedModifier;
    }
  };
}
