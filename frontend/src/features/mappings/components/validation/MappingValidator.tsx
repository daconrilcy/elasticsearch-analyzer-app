import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './MappingValidator.module.scss';

interface MappingValidatorProps {
  mapping: any;
  onValidationComplete?: (validation: ValidationResponse) => void;
}

interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  path?: string;
  field?: string;
  suggestion?: string;
}

interface ValidationResponse {
  valid: boolean;
  issues: ValidationIssue[];
  processing_time_ms: number;
  schema_version: string;
}

async function validateMapping(mapping: any): Promise<ValidationResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapping),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate mapping: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function MappingValidator({ mapping, onValidationComplete }: MappingValidatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const validationMutation = useMutation({
    mutationFn: validateMapping,
    onSuccess: (data) => {
      console.log('Validation result:', data);
      onValidationComplete?.(data);
    },
    onError: (error) => {
      console.error('Erreur lors de la validation:', error);
    },
  });

  const handleValidate = () => {
    if (!mapping) return;
    validationMutation.mutate(mapping);
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

  const errorCount = validationMutation.data?.issues.filter(i => i.severity === 'error').length || 0;
  const warningCount = validationMutation.data?.issues.filter(i => i.severity === 'warning').length || 0;
  const infoCount = validationMutation.data?.issues.filter(i => i.severity === 'info').length || 0;

  return (
    <div className={styles.mappingValidator}>
      <div className={styles.header}>
        <h3>Validation du Mapping</h3>
        <div className={styles.headerActions}>
          {validationMutation.data && (
            <div className={styles.validationSummary}>
              <span className={`${styles.summaryItem} ${errorCount > 0 ? styles.hasErrors : ''}`}>
                {errorCount} erreurs
              </span>
              <span className={`${styles.summaryItem} ${warningCount > 0 ? styles.hasWarnings : ''}`}>
                {warningCount} avertissements
              </span>
              <span className={styles.summaryItem}>
                {infoCount} infos
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
              Validation du mapping contre le schéma JSON. Vérifie la conformité des types, 
              la structure des opérations et la cohérence globale du mapping.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleValidate}
              disabled={validationMutation.isPending || !mapping}
              className={styles.validateButton}
            >
              {validationMutation.isPending ? 'Validation en cours...' : 'Valider le Mapping'}
            </button>
          </div>

          {validationMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors de la validation:</p>
              <p>{validationMutation.error?.message}</p>
            </div>
          )}

          {validationMutation.data && (
            <div className={styles.results}>
              <div className={styles.summary}>
                <h4>Résultats de la Validation</h4>
                <div className={styles.summaryDetails}>
                  <p>
                    <strong>Statut:</strong>{' '}
                    <span className={validationMutation.data.valid ? styles.valid : styles.invalid}>
                      {validationMutation.data.valid ? '✅ Valide' : '❌ Invalide'}
                    </span>
                  </p>
                  <p>
                    <strong>Version du schéma:</strong> {validationMutation.data.schema_version}
                  </p>
                  <p>
                    <strong>Temps de traitement:</strong> {validationMutation.data.processing_time_ms}ms
                  </p>
                </div>
              </div>

              {validationMutation.data.issues.length > 0 ? (
                <div className={styles.issues}>
                  <h5>Problèmes détectés</h5>
                  <div className={styles.issuesList}>
                    {validationMutation.data.issues.map((issue, index) => (
                      <div key={index} className={`${styles.issueItem} ${getSeverityColor(issue.severity)}`}>
                        <div className={styles.issueHeader}>
                          <span className={styles.severityIcon}>
                            {getSeverityIcon(issue.severity)}
                          </span>
                          <span className={styles.severityLabel}>
                            {getSeverityLabel(issue.severity)}
                          </span>
                          {issue.code && (
                            <span className={styles.issueCode}>
                              {issue.code}
                            </span>
                          )}
                        </div>
                        
                        <div className={styles.issueMessage}>
                          {issue.message}
                        </div>
                        
                        {issue.path && (
                          <div className={styles.issuePath}>
                            <strong>Chemin:</strong> <code>{issue.path}</code>
                          </div>
                        )}
                        
                        {issue.field && (
                          <div className={styles.issueField}>
                            <strong>Champ:</strong> <code>{issue.field}</code>
                          </div>
                        )}
                        
                        {issue.suggestion && (
                          <div className={styles.issueSuggestion}>
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noIssues}>
                  <p>✅ Aucun problème détecté. Le mapping est valide !</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
