import React, { useEffect, useRef, useState } from 'react';
import * as jsondiffpatch from 'jsondiffpatch';
import styles from './RichDiffView.module.scss';

interface RichDiffViewProps {
  leftMapping: any;
  rightMapping: any;
  showInline?: boolean;
  showUnchanged?: boolean;
  className?: string;
}

/**
 * Composant de diff riche pour les merge requests de mapping
 * Utilise jsondiffpatch pour un affichage visuel avancé des différences
 */
export const RichDiffView: React.FC<RichDiffViewProps> = ({
  leftMapping,
  rightMapping,
  showInline: initialShowInline = false,
  showUnchanged: initialShowUnchanged = false,
  className = ''
}) => {
  const diffContainerRef = useRef<HTMLDivElement>(null);
  const [diff, setDiff] = useState<any>(null);
  const [showInline, setShowInline] = useState(initialShowInline);
  const [showUnchanged, setShowUnchanged] = useState(initialShowUnchanged);
  const [diffStats, setDiffStats] = useState({
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0
  });

  useEffect(() => {
    if (!leftMapping || !rightMapping) return;

    try {
      // Créer l'instance jsondiffpatch
      const instance = jsondiffpatch.create({
        propertyFilter: (name: string) => {
          // Filtrer les propriétés non pertinentes pour le diff
          if (name === '_id' || name === 'created_at' || name === 'updated_at') {
            return false;
          }
          return true;
        },
        arrays: {
          detectMove: true,
          includeValueOnMove: false
        }
      });

      // Calculer le diff
      const diffResult = instance.diff(leftMapping, rightMapping);
      setDiff(diffResult);

      // Calculer les statistiques
      if (diffResult) {
        const stats = calculateDiffStats(diffResult);
        setDiffStats(stats);
      }
    } catch (error) {
      console.error('Erreur lors du calcul du diff:', error);
    }
  }, [leftMapping, rightMapping]);

  const calculateDiffStats = (diffObj: any): any => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    let unchanged = 0;

    const traverse = (obj: any, path: string = '') => {
      if (!obj) return;

      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (item === undefined) {
            removed++;
          } else if (item && item.length === 1) {
            added++;
          } else if (item && item.length === 2) {
            modified++;
          } else if (item && item.length === 3) {
            unchanged++;
          }
        });
      } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (value === undefined) {
            removed++;
          } else if (value && value.length === 1) {
            added++;
          } else if (value && value.length === 2) {
            modified++;
          } else if (value && value.length === 3) {
            unchanged++;
          } else if (typeof value === 'object') {
            traverse(value, `${path}.${key}`);
          }
        });
      }
    };

    traverse(diffObj);
    return { added, removed, modified, unchanged };
  };

  const renderDiff = () => {
    if (!diff || !diffContainerRef.current) return;

    try {
      // Afficher le diff brut en format JSON avec coloration
      const diffText = JSON.stringify(diff, null, 2);
      const highlightedDiff = highlightDiff(diffText);
      diffContainerRef.current.innerHTML = `<pre class="${styles.diffCode}">${highlightedDiff}</pre>`;
    } catch (error) {
      console.error('Erreur lors du rendu du diff:', error);
      // Fallback en cas d'erreur
      if (diffContainerRef.current) {
        const diffText = JSON.stringify(diff, null, 2);
        diffContainerRef.current.innerHTML = `<pre>${diffText}</pre>`;
      }
    }
  };

  const highlightDiff = (diffText: string): string => {
    // Coloration basique du diff
    return diffText
      .replace(/"([^"]+)":\s*\[([^\]]+)\]/g, '<span class="jsondiffpatch-property-name">"$1"</span>: <span class="jsondiffpatch-value">[$2]</span>')
      .replace(/"([^"]+)":\s*"([^"]*)"/g, '<span class="jsondiffpatch-property-name">"$1"</span>: <span class="jsondiffpatch-value">"$2"</span>')
      .replace(/"([^"]+)":\s*(\d+)/g, '<span class="jsondiffpatch-property-name">"$1"</span>: <span class="jsondiffpatch-value">$2</span>')
      .replace(/"([^"]+)":\s*(true|false|null)/g, '<span class="jsondiffpatch-property-name">"$1"</span>: <span class="jsondiffpatch-value">$2</span>');
  };

  useEffect(() => {
    if (diff) {
      renderDiff();
    }
  }, [diff]);

  if (!leftMapping || !rightMapping) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.error}>
          ❌ Impossible de comparer les mappings : données manquantes
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* En-tête avec statistiques */}
      <div className={styles.header}>
        <h3>🔍 Diff des Mappings</h3>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles.added}>+{diffStats.added}</span>
            Ajoutés
          </span>
          <span className={styles.stat}>
            <span className={styles.removed}>-{diffStats.removed}</span>
            Supprimés
          </span>
          <span className={styles.stat}>
            <span className={styles.modified}>~{diffStats.modified}</span>
            Modifiés
          </span>
          <span className={styles.stat}>
            <span className={styles.unchanged}>={diffStats.unchanged}</span>
            Inchangés
          </span>
        </div>
      </div>

      {/* Contrôles d'affichage */}
      <div className={styles.controls}>
        <label className={styles.control}>
          <input
            type="checkbox"
            checked={showInline}
            onChange={(e) => setShowInline(e.target.checked)}
          />
          Affichage inline
        </label>
        <label className={styles.control}>
          <input
            type="checkbox"
            checked={showUnchanged}
            onChange={(e) => setShowUnchanged(e.target.checked)}
          />
          Afficher les champs inchangés
        </label>
      </div>

      {/* Conteneur du diff */}
      <div className={styles.diffContainer}>
        <div 
          ref={diffContainerRef} 
          className={`${styles.diffContent} ${showInline ? styles.inline : ''}`}
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={() => {
            if (diffContainerRef.current) {
              diffContainerRef.current.innerHTML = '';
              renderDiff();
            }
          }}
        >
          🔄 Actualiser le diff
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => {
            const diffText = JSON.stringify(diff, null, 2);
            navigator.clipboard.writeText(diffText);
          }}
        >
          📋 Copier le diff
        </button>
      </div>
    </div>
  );
};

export default RichDiffView;
