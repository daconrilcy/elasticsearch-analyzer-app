import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './MappingDryRun.module.scss';

interface MappingDryRunProps {
  mapping: any;
  sampleData: Array<Record<string, any>>;
  onDryRunComplete?: (results: DryRunResponse) => void;
}

interface DryRunIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  count: number;
  examples: Array<{ row: number; value: any; field?: string }>;
}

interface DryRunResponse {
  success: boolean;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  issues: DryRunIssue[];
  docs_preview: Array<Record<string, any>>;
  processing_time_ms: number;
  issues_per_code: Record<string, number>;
}

async function executeDryRun(
  mapping: any,
  sampleData: Array<Record<string, any>>
): Promise<DryRunResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/dry-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mapping,
      rows: sampleData,
      globals: {}
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to execute dry-run: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function MappingDryRun({ mapping, sampleData, onDryRunComplete }: MappingDryRunProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  type DryRunVars = { mapping: any; sampleData: Record<string, any>[] };
  
  const dryRunMutation = useMutation<DryRunResponse, Error, DryRunVars>({
    mutationFn: (vars) => executeDryRun(vars.mapping, vars.sampleData),
    onSuccess: (data) => {
      console.log('Dry-run results:', data);
      onDryRunComplete?.(data);
    },
    onError: (error) => {
      console.error('Erreur lors du dry-run:', error);
    },
  });

  const handleDryRun = () => {
    if (!mapping || sampleData.length === 0) return;
    
    // Limiter à 1000 lignes pour le dry-run
    const limitedSample = sampleData.slice(0, 1000);
    dryRunMutation.mutate({ mapping, sampleData: limitedSample });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return styles.errorSeverity;
      case 'warning':
        return styles.warningSeverity;
      case 'info':
        return styles.infoSeverity;
      default:
        return styles.unknownSeverity;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'Erreur';
      case 'warning':
        return 'Avertissement';
      case 'info':
        return 'Information';
      default:
        return 'Inconnu';
    }
  };

  const successRate = dryRunMutation.data 
    ? Math.round((dryRunMutation.data.successful_rows / dryRunMutation.data.processed_rows) * 100)
    : 0;

  const totalIssues = dryRunMutation.data?.issues.reduce((sum, issue) => sum + issue.count, 0) || 0;

  return (
    <div className={styles.mappingDryRun}>
      <div className={styles.header}>
        <h3>Dry-Run du Mapping</h3>
        <div className={styles.headerActions}>
          {dryRunMutation.data && (
            <div className={styles.dryRunSummary}>
              <span className={styles.summaryItem}>
                {successRate}% succès
              </span>
              <span className={styles.summaryItem}>
                {totalIssues} problèmes
              </span>
              <span className={styles.summaryItem}>
                {dryRunMutation.data.processing_time_ms}ms
              </span>
            </div>
          )}
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
          <div className={styles.info}>
            <p>
              Testez votre mapping sur un échantillon de {sampleData.length} lignes de données.
              Le dry-run simule l'exécution complète et identifie les problèmes potentiels.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleDryRun}
              disabled={dryRunMutation.isPending || !mapping || sampleData.length === 0}
              className={styles.dryRunButton}
            >
              {dryRunMutation.isPending ? 'Exécution en cours...' : 'Lancer le Dry-Run'}
            </button>
          </div>

          {dryRunMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors du dry-run:</p>
              <p>{dryRunMutation.error?.message}</p>
            </div>
          )}

          {dryRunMutation.data && (
            <div className={styles.results}>
              <div className={styles.summary}>
                <h4>Résultats du Dry-Run</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{dryRunMutation.data.processed_rows}</div>
                    <div className={styles.summaryLabel}>Lignes traitées</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{dryRunMutation.data.successful_rows}</div>
                    <div className={styles.summaryLabel}>Succès</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{dryRunMutation.data.failed_rows}</div>
                    <div className={styles.summaryLabel}>Échecs</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{successRate}%</div>
                    <div className={styles.summaryLabel}>Taux de succès</div>
                  </div>
                </div>
              </div>

              {dryRunMutation.data.issues.length > 0 ? (
                <div className={styles.issues}>
                  <h5>Problèmes détectés</h5>
                  <div className={styles.issuesList}>
                    {dryRunMutation.data.issues.map((issue, index) => (
                      <div key={index} className={`${styles.issueItem} ${getSeverityColor(issue.severity)}`}>
                        <div className={styles.issueHeader}>
                          <span className={styles.severityIcon}>
                            {getSeverityIcon(issue.severity)}
                          </span>
                          <span className={styles.severityLabel}>
                            {getSeverityLabel(issue.severity)}
                          </span>
                          <span className={styles.issueCode}>
                            {issue.code}
                          </span>
                          <span className={styles.issueCount}>
                            {issue.count} occurrence(s)
                          </span>
                        </div>
                        
                        <div className={styles.issueMessage}>
                          {issue.message}
                        </div>
                        
                        {issue.examples.length > 0 && (
                          <div className={styles.issueExamples}>
                            <strong>Exemples:</strong>
                            <div className={styles.examplesList}>
                              {issue.examples.slice(0, 3).map((example, idx) => (
                                <div key={idx} className={styles.example}>
                                  <span className={styles.exampleRow}>Ligne {example.row + 1}</span>
                                  {example.field && (
                                    <span className={styles.exampleField}>Champ: {example.field}</span>
                                  )}
                                  <span className={styles.exampleValue}>
                                    Valeur: {String(example.value).length > 50 
                                      ? `${String(example.value).substring(0, 50)}...` 
                                      : String(example.value)}
                                  </span>
                                </div>
                              ))}
                              {issue.examples.length > 3 && (
                                <span className={styles.moreExamples}>
                                  +{issue.examples.length - 3} autres exemples
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noIssues}>
                  <p>✅ Aucun problème détecté lors du dry-run !</p>
                </div>
              )}

              {dryRunMutation.data.docs_preview.length > 0 && (
                <div className={styles.preview}>
                  <div className={styles.previewHeader}>
                    <h5>Aperçu des documents transformés</h5>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className={styles.previewToggle}
                    >
                      {showPreview ? 'Masquer' : 'Afficher'} l'aperçu
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div className={styles.previewContent}>
                      <div className={styles.previewTable}>
                        <table>
                          <thead>
                            <tr>
                              {Object.keys(dryRunMutation.data.docs_preview[0] || {}).map(key => (
                                <th key={key}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dryRunMutation.data.docs_preview.slice(0, 10).map((doc, index) => (
                              <tr key={index}>
                                {Object.values(doc).map((value, idx) => (
                                  <td key={idx}>
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value).substring(0, 100) + '...'
                                      : String(value).substring(0, 100)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {dryRunMutation.data.docs_preview.length > 10 && (
                          <p className={styles.previewNote}>
                            Affichage des 10 premiers documents sur {dryRunMutation.data.docs_preview.length}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {Object.keys(dryRunMutation.data.issues_per_code || {}).length > 0 && (
                <div className={styles.issuesHistogram}>
                  <h5>Répartition des problèmes par code</h5>
                  <div className={styles.histogram}>
                    {Object.entries(dryRunMutation.data.issues_per_code).map(([code, count]) => (
                      <div key={code} className={styles.histogramBar}>
                        <div 
                          className={styles.barFill} 
                          style={{ 
                            height: `${(count / Math.max(...Object.values(dryRunMutation.data.issues_per_code))) * 100}%` 
                          }}
                        ></div>
                        <span className={styles.barLabel}>{code}</span>
                        <span className={styles.barValue}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
