import React, { useMemo } from 'react';
import styles from './DiffView.module.scss';

interface DiffViewProps {
  oldMapping: any;
  newMapping: any;
  className?: string;
}

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export const DiffView: React.FC<DiffViewProps> = ({
  oldMapping,
  newMapping,
  className,
}) => {
  const diffResults = useMemo(() => {
    const results: DiffResult[] = [];
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
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
          } else {
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
    
    compareObjects(oldMapping, newMapping);
    return results;
  }, [oldMapping, newMapping]);

  const addedCount = diffResults.filter(r => r.type === 'added').length;
  const removedCount = diffResults.filter(r => r.type === 'removed').length;
  const modifiedCount = diffResults.filter(r => r.type === 'modified').length;

  const renderValue = (value: any) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h4>Diff des versions</h4>
        <div className={styles.summary}>
          <span className={styles.added}>+{addedCount}</span>
          <span className={styles.removed}>-{removedCount}</span>
          <span className={styles.modified}>~{modifiedCount}</span>
        </div>
      </div>

      <div className={styles.diffContent}>
        {diffResults.length === 0 ? (
          <div className={styles.noChanges}>
            <p>Aucune différence détectée</p>
          </div>
        ) : (
          <div className={styles.changes}>
            {diffResults.map((change, index) => (
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
    </div>
  );
};

export default DiffView;
