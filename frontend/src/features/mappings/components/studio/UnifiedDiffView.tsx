import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as jsondiffpatch from 'jsondiffpatch';
import styles from './UnifiedDiffView.module.scss';

interface UnifiedDiffViewProps {
  leftMapping: any;
  rightMapping: any;
  mode?: 'simple' | 'advanced';  // 'simple' = DiffView, 'advanced' = RichDiffView
  showInline?: boolean;
  showUnchanged?: boolean;
  className?: string;
}

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  path: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Composant unifié de diff pour les mappings
 * Combine les fonctionnalités de DiffView (simple) et RichDiffView (avancé)
 * Mode 'simple' : Comparaison basique native React
 * Mode 'advanced' : Diff riche avec jsondiffpatch
 */
export const UnifiedDiffView: React.FC<UnifiedDiffViewProps> = ({
  leftMapping,
  rightMapping,
  mode = 'advanced',
  showInline: initialShowInline = false,
  showUnchanged: initialShowUnchanged = false,
  className = ''
}) => {
  const diffContainerRef = useRef<HTMLDivElement>(null);
  const [showInline, setShowInline] = useState(initialShowInline);
  const [showUnchanged, setShowUnchanged] = useState(initialShowUnchanged);
  
  // État pour le mode avancé
  const [diff, setDiff] = useState<any>(null);
  const [diffStats, setDiffStats] = useState({
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0
  });

  // État pour le mode simple
  const [simpleDiffResults, setSimpleDiffResults] = useState<DiffResult[]>([]);

  // Calcul du diff simple (mode DiffView)
  const calculateSimpleDiff = useMemo(() => {
    if (mode !== 'simple') return [];

    const results: DiffResult[] = [];
    const visited = new WeakSet(); // Protection contre les références cycliques
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      // Protection contre les références cycliques
      if (obj1 && typeof obj1 === 'object' && visited.has(obj1)) return;
      if (obj2 && typeof obj2 === 'object' && visited.has(obj2)) return;
      
      if (obj1 && typeof obj1 === 'object') visited.add(obj1);
      if (obj2 && typeof obj2 === 'object') visited.add(obj2);
      
      const keys1 = Object.keys(obj1 || {});
      const keys2 = Object.keys(obj2 || {});
      
      // Trouver les clés ajoutées
      keys2.forEach(key => {
        if (!keys1.includes(key)) {
          results.push({
            type: 'added',
            path: path ? `${path}.${key}` : key,
            newValue: obj2[key]
          });
        }
      });
      
      // Trouver les clés supprimées
      keys1.forEach(key => {
        if (!keys2.includes(key)) {
          results.push({
            type: 'removed',
            path: path ? `${path}.${key}` : key,
            oldValue: obj1[key]
          });
        }
      });
      
      // Comparer les clés communes
      keys1.forEach(key => {
        if (keys2.includes(key)) {
          const currentPath = path ? `${path}.${key}` : key;
          const val1 = obj1[key];
          const val2 = obj2[key];
          
          if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
            // Récursion pour les objets imbriqués
            compareObjects(val1, val2, currentPath);
          } else if (val1 !== val2) {
            // Valeurs modifiées
            results.push({
              type: 'modified',
              path: currentPath,
              oldValue: val1,
              newValue: val2
            });
          } else if (showUnchanged) {
            // Valeurs inchangées (optionnel)
            results.push({
              type: 'unchanged',
              path: currentPath,
              oldValue: val1,
              newValue: val2
            });
          }
        }
      });
    };
    
    compareObjects(leftMapping, rightMapping);
    return results;
  }, [leftMapping, rightMapping, mode, showUnchanged]);

  // Calcul du diff avancé (mode RichDiffView)
  useEffect(() => {
    if (mode !== 'advanced' || !leftMapping || !rightMapping) return;

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
        const stats = calculateAdvancedDiffStats(diffResult);
        setDiffStats(stats);
      }
    } catch (error) {
      console.error('Erreur lors du calcul du diff avancé:', error);
    }
  }, [leftMapping, rightMapping, mode]);

  // Mise à jour des résultats du diff simple
  useEffect(() => {
    if (mode === 'simple') {
      setSimpleDiffResults(calculateSimpleDiff);
    }
  }, [calculateSimpleDiff, mode]);

  const calculateAdvancedDiffStats = (diffObj: any): any => {
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

  const renderAdvancedDiff = () => {
    if (!diff || !diffContainerRef.current) return;

    try {
      // Afficher le diff brut en format JSON avec coloration
      const diffText = JSON.stringify(diff, null, 2);
      const highlightedDiff = highlightDiff(diffText);
      diffContainerRef.current.innerHTML = `<pre class="${styles.diffCode}">${highlightedDiff}</pre>`;
    } catch (error) {
      console.error('Erreur lors du rendu du diff avancé:', error);
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
    if (diff && mode === 'advanced') {
      renderAdvancedDiff();
    }
  }, [diff, mode]);

  const renderValue = (value: any) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Calcul des statistiques pour le mode simple
  const simpleAddedCount = simpleDiffResults.filter(r => r.type === 'added').length;
  const simpleRemovedCount = simpleDiffResults.filter(r => r.type === 'removed').length;
  const simpleModifiedCount = simpleDiffResults.filter(r => r.type === 'modified').length;

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
      {/* En-tête avec mode et statistiques */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>🔍 Diff des Mappings</h3>
          <div className={styles.modeIndicator}>
            Mode: <span className={styles.modeBadge}>{mode === 'simple' ? 'Simple' : 'Avancé'}</span>
          </div>
        </div>
        
        <div className={styles.stats}>
          {mode === 'simple' ? (
            <>
              <span className={styles.stat}>
                <span className={styles.added}>+{simpleAddedCount}</span>
                Ajoutés
              </span>
              <span className={styles.stat}>
                <span className={styles.removed}>-{simpleRemovedCount}</span>
                Supprimés
              </span>
              <span className={styles.stat}>
                <span className={styles.modified}>~{simpleModifiedCount}</span>
                Modifiés
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Contrôles d'affichage (mode avancé uniquement) */}
      {mode === 'advanced' && (
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
      )}

      {/* Conteneur du diff */}
      <div className={styles.diffContainer}>
        {mode === 'simple' ? (
          // Mode simple - Affichage basique
          <div className={styles.diffContent}>
            {simpleDiffResults.length === 0 ? (
              <div className={styles.noChanges}>
                <p>Aucune différence détectée</p>
              </div>
            ) : (
              <div className={styles.changes}>
                {simpleDiffResults.map((change, index) => (
                  <div key={index} className={`${styles.change} ${styles[change.type]}`}>
                    <div className={styles.changeHeader}>
                      <span className={styles.changeType}>
                        {change.type === 'added' && '+'}
                        {change.type === 'removed' && '-'}
                        {change.type === 'modified' && '~'}
                        {change.type === 'unchanged' && '='}
                      </span>
                      <span className={styles.changePath}>{change.path}</span>
                    </div>
                    
                    {change.type === 'added' && (
                      <div className={styles.changeValue}>
                        <span className={styles.label}>Nouvelle valeur:</span>
                        <pre>{renderValue(change.newValue)}</pre>
                      </div>
                    )}
                    
                    {change.type === 'removed' && (
                      <div className={styles.changeValue}>
                        <span className={styles.label}>Valeur supprimée:</span>
                        <pre>{renderValue(change.oldValue)}</pre>
                      </div>
                    )}
                    
                    {change.type === 'modified' && (
                      <div className={styles.changeValue}>
                        <div className={styles.oldValue}>
                          <span className={styles.label}>Ancienne valeur:</span>
                          <pre>{renderValue(change.oldValue)}</pre>
                        </div>
                        <div className={styles.newValue}>
                          <span className={styles.label}>Nouvelle valeur:</span>
                          <pre>{renderValue(change.newValue)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Mode avancé - jsondiffpatch
          <div 
            ref={diffContainerRef} 
            className={`${styles.diffContent} ${showInline ? styles.inline : ''}`}
          />
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {mode === 'advanced' && (
          <>
            <button 
              className={styles.actionButton}
              onClick={() => {
                if (diffContainerRef.current) {
                  diffContainerRef.current.innerHTML = '';
                  renderAdvancedDiff();
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
          </>
        )}
        
        <button 
          className={styles.actionButton}
          onClick={() => {
            // Basculer entre les modes
            const newMode = mode === 'simple' ? 'advanced' : 'simple';
            // Note: En pratique, il faudrait un callback pour changer le mode depuis le parent
            console.log(`Mode changé vers: ${newMode}`);
          }}
        >
          🔄 Basculer vers le mode {mode === 'simple' ? 'Avancé' : 'Simple'}
        </button>
      </div>
    </div>
  );
};

export default UnifiedDiffView;
