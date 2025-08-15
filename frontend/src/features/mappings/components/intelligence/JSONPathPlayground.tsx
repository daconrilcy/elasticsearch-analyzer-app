import { useState, useMemo } from 'react';
import styles from './JSONPathPlayground.module.scss';

interface JSONPathPlaygroundProps {
  sampleData: Array<Record<string, any>>;
  onPathSelect?: (path: string) => void;
}

interface PreviewResult {
  rowIndex: number;
  original: Record<string, any>;
  result: any;
  hasError: boolean;
  error?: string;
}

export function JSONPathPlayground({ sampleData, onPathSelect }: JSONPathPlaygroundProps) {
  const [jsonPath, setJsonPath] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);

  // Évaluer le JSONPath sur les données d'exemple
  const previewResults = useMemo((): PreviewResult[] => {
    if (!jsonPath.trim() || !sampleData.length) return [];
    
    try {
      return sampleData.map((row, index) => {
        const result = evaluateJSONPath(jsonPath, row);
        return {
          rowIndex: index,
          original: row,
          result,
          hasError: result === null
        };
      });
    } catch (error) {
      return sampleData.map((row, index) => ({
        rowIndex: index,
        original: row,
        result: null,
        hasError: true,
        error: error instanceof Error ? error.message : 'Erreur JSONPath'
      }));
    }
  }, [jsonPath, sampleData]);

  // Exemples de JSONPath prédéfinis
  const predefinedPaths = [
    '$.name',
    '$.age',
    '$.email',
    '$.address.city',
    '$.tags[*]',
    '$.metadata.created_at',
    '$.items[*].id',
    '$.nested.field[*].value'
  ];

  const handlePathSelect = (path: string) => {
    setJsonPath(path);
    onPathSelect?.(path);
  };

  const handleTestPath = () => {
    if (jsonPath.trim()) {
      onPathSelect?.(jsonPath);
    }
  };

  return (
    <div className={styles.jsonPathPlayground}>
      <div className={styles.header}>
        <h3>🔍 JSONPath Playground</h3>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandButton}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {/* Input JSONPath */}
          <div className={styles.inputSection}>
            <label htmlFor="jsonpath-input">Expression JSONPath:</label>
            <div className={styles.inputGroup}>
              <input
                id="jsonpath-input"
                type="text"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                placeholder="$.field[*].subfield"
                className={styles.jsonPathInput}
              />
              <button
                onClick={handleTestPath}
                disabled={!jsonPath.trim()}
                className={styles.testButton}
              >
                🧪 Tester
              </button>
            </div>
          </div>

          {/* Chemins prédéfinis */}
          <div className={styles.predefinedSection}>
            <h4>Exemples prédéfinis:</h4>
            <div className={styles.predefinedPaths}>
              {predefinedPaths.map((path) => (
                <button
                  key={path}
                  onClick={() => handlePathSelect(path)}
                  className={styles.predefinedPath}
                  title={`Tester: ${path}`}
                >
                  {path}
                </button>
              ))}
            </div>
          </div>

          {/* Preview des résultats */}
          <div className={styles.previewSection}>
            <h4>Preview des résultats:</h4>
            <div className={styles.previewControls}>
              <label>
                Ligne à afficher:
                <select
                  value={selectedRow}
                  onChange={(e) => setSelectedRow(parseInt(e.target.value))}
                  className={styles.rowSelector}
                >
                  {sampleData.map((_, index) => (
                    <option key={index} value={index}>
                      Ligne {index + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {previewResults.length > 0 && (
              <div className={styles.previewResults}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultLabel}>Résultat JSONPath:</span>
                  <span className={styles.resultPath}>{jsonPath}</span>
                </div>
                
                <div className={styles.resultContent}>
                  {previewResults[selectedRow]?.hasError ? (
                    <div className={styles.errorResult}>
                      ❌ Erreur: {previewResults[selectedRow]?.error || 'Expression invalide'}
                    </div>
                  ) : (
                    <pre className={styles.jsonResult} data-testid="json-result">
                      {JSON.stringify(previewResults[selectedRow]?.result, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Statistiques des résultats */}
                <div className={styles.resultStats}>
                  <span>Total: {previewResults.length} lignes</span>
                  <span>Succès: {previewResults.filter(r => !r.hasError).length}</span>
                  <span>Erreurs: {previewResults.filter(r => r.hasError).length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Fonction d'évaluation JSONPath simplifiée
function evaluateJSONPath(path: string, data: any): any {
  if (!path.startsWith('$.')) {
    throw new Error('JSONPath doit commencer par "$."');
  }

  const parts = path.slice(2).split('.');
  let current = data;

  for (const part of parts) {
    if (part === '*') {
      if (Array.isArray(current)) {
        current = current.map(item => item);
      } else {
        throw new Error('Wildcard * ne peut être utilisé que sur des tableaux');
      }
    } else if (part.includes('[') && part.includes(']')) {
      // Gestion des index: field[0], field[1:3], etc.
      const [fieldName, indexPart] = part.split('[');
      const indexStr = indexPart.replace(']', '');
      
      if (!current[fieldName]) {
        throw new Error(`Champ "${fieldName}" non trouvé`);
      }
      
      if (indexStr === '*') {
        current = current[fieldName];
      } else if (indexStr.includes(':')) {
        const [start, end] = indexStr.split(':').map(i => i ? parseInt(i) : undefined);
        current = current[fieldName].slice(start, end);
      } else {
        const index = parseInt(indexStr);
        current = current[fieldName][index];
      }
    } else {
      if (!(part in current)) {
        throw new Error(`Champ "${part}" non trouvé`);
      }
      current = current[part];
    }
  }

  return current;
}
