import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './TypeInference.module.scss';

interface TypeInferenceProps {
  sampleData: Array<Record<string, any>>;
  onTypesApplied: (inferredTypes: Record<string, any>) => void;
}

interface InferredType {
  field: string;
  suggested_type: string;
  confidence: number;
  sample_values: string[];
  reasoning: string;
}

interface TypeInferenceResponse {
  inferred_types: InferredType[];
  total_fields: number;
  processing_time_ms: number;
}

async function inferTypes(sampleData: Array<Record<string, any>>): Promise<TypeInferenceResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/infer-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rows: sampleData,
      globals: {}
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to infer types: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function TypeInference({ sampleData, onTypesApplied }: TypeInferenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const inferenceMutation = useMutation({
    mutationFn: inferTypes,
    onSuccess: (data) => {
      console.log('Types inférés:', data);
    },
    onError: (error) => {
      console.error('Erreur lors de l\'inférence des types:', error);
    },
  });

  const handleInferTypes = () => {
    if (sampleData.length === 0) return;
    
    // Limiter à 100 lignes pour l'inférence
    const limitedSample = sampleData.slice(0, 100);
    inferenceMutation.mutate(limitedSample);
  };

  const handleApplyTypes = () => {
    if (inferenceMutation.data) {
      const typesMap: Record<string, any> = {};
      inferenceMutation.data.inferred_types.forEach(type => {
        typesMap[type.field] = {
          es_type: type.suggested_type,
          confidence: type.confidence,
          reasoning: type.reasoning
        };
      });
      onTypesApplied(typesMap);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return styles.highConfidence;
    if (confidence >= 0.6) return styles.mediumConfidence;
    return styles.lowConfidence;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Élevée';
    if (confidence >= 0.6) return 'Moyenne';
    return 'Faible';
  };

  return (
    <div className={styles.typeInference}>
      <div className={styles.header}>
        <h3>Inférence des Types</h3>
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
          <div className={styles.info}>
            <p>
              Analyse automatique des types Elasticsearch basée sur un échantillon de {sampleData.length} lignes.
              L'inférence utilise des heuristiques pour suggérer le type le plus approprié pour chaque champ.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleInferTypes}
              disabled={inferenceMutation.isPending || sampleData.length === 0}
              className={styles.inferButton}
            >
              {inferenceMutation.isPending ? 'Analyse en cours...' : 'Inférer les Types'}
            </button>
          </div>

          {inferenceMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors de l'inférence des types:</p>
              <p>{inferenceMutation.error?.message}</p>
            </div>
          )}

          {inferenceMutation.data && (
            <div className={styles.results}>
              <div className={styles.summary}>
                <h4>Résultats de l'Inférence</h4>
                <p>
                  {inferenceMutation.data.total_fields} champs analysés en{' '}
                  {inferenceMutation.data.processing_time_ms}ms
                </p>
              </div>

              <div className={styles.typesList}>
                {inferenceMutation.data.inferred_types.map((type) => (
                  <div key={type.field} className={styles.typeItem}>
                    <div className={styles.typeHeader}>
                      <span className={styles.fieldName}>{type.field}</span>
                      <span className={styles.suggestedType}>{type.suggested_type}</span>
                      <span className={`${styles.confidence} ${getConfidenceColor(type.confidence)}`}>
                        Confiance: {getConfidenceLabel(type.confidence)} ({Math.round(type.confidence * 100)}%)
                      </span>
                    </div>
                    
                    <div className={styles.typeDetails}>
                      <div className={styles.reasoning}>
                        <strong>Raisonnement:</strong> {type.reasoning}
                      </div>
                      
                      <div className={styles.samples}>
                        <strong>Exemples de valeurs:</strong>
                        <div className={styles.sampleValues}>
                          {type.sample_values.slice(0, 5).map((value, index) => (
                            <span key={index} className={styles.sampleValue}>
                              {String(value).length > 20 ? `${String(value).substring(0, 20)}...` : String(value)}
                            </span>
                          ))}
                          {type.sample_values.length > 5 && (
                            <span className={styles.moreSamples}>
                              +{type.sample_values.length - 5} autres
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.applyActions}>
                <button
                  type="button"
                  onClick={handleApplyTypes}
                  className={styles.applyButton}
                >
                  Appliquer les Types Inférés
                </button>
                <p className={styles.applyNote}>
                  ⚠️ Cette action remplacera les types existants par les types suggérés.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
