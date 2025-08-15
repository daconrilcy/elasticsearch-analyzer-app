import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './SizeEstimation.module.scss';

interface SizeEstimationProps {
  mapping: any;
  fieldStats?: Array<{ field: string; avg_size: number; distinct_count: number }>;
  numDocs?: number;
  onEstimationComplete?: (estimation: SizeEstimationResponse) => void;
}

interface SizeEstimationResponse {
  estimated_size_bytes: number;
  estimated_size_gb: number;
  recommended_shards: number;
  estimated_doc_size_bytes: number;
  index_overhead_gb: number;
  total_storage_gb: number;
  recommendations: string[];
  processing_time_ms: number;
}

async function estimateSize(
  mapping: any,
  fieldStats: Array<{ field: string; avg_size: number; distinct_count: number }> = [],
  numDocs: number = 1000000,
  replicas: number = 1,
  targetShardSizeGb: number = 30
): Promise<SizeEstimationResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/estimate-size`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mapping,
      field_stats: fieldStats,
      num_docs: numDocs,
      replicas,
      target_shard_size_gb: targetShardSizeGb
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to estimate size: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function SizeEstimation({ 
  mapping, 
  fieldStats = [], 
  numDocs = 1000000,
  onEstimationComplete 
}: SizeEstimationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replicas, setReplicas] = useState(1);
  const [targetShardSizeGb, setTargetShardSizeGb] = useState(30);

  const estimationMutation = useMutation({
    mutationFn: (params: { mapping: any; fieldStats: any[]; numDocs: number; replicas: number; targetShardSizeGb: number }) =>
      estimateSize(params.mapping, params.fieldStats, params.numDocs, params.replicas, params.targetShardSizeGb),
    onSuccess: (data) => {
      console.log('Estimation de taille:', data);
      onEstimationComplete?.(data);
    },
    onError: (error) => {
      console.error('Erreur lors de l\'estimation de la taille:', error);
    },
  });

  const handleEstimateSize = () => {
    if (!mapping) return;
    
    estimationMutation.mutate({
      mapping,
      fieldStats,
      numDocs,
      replicas,
      targetShardSizeGb
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`; // force "10.00 KB"
  };

  const formatGB = (gb?: number): string => gb != null ? `${gb.toFixed(2)} GB` : '—';

  return (
    <div className={styles.sizeEstimation}>
      <div className={styles.header}>
        <h3>Estimation de la Taille</h3>
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
              Estimation de la taille de l'index et recommandations pour le nombre de shards 
              basées sur la configuration du mapping et les statistiques des champs.
            </p>
          </div>

          <div className={styles.configuration}>
            <h4>Configuration</h4>
            <div className={styles.configGrid}>
              <div className={styles.configItem}>
                <label>Nombre de documents:</label>
                <input
                  type="number"
                  value={numDocs}
                  disabled
                  className={styles.configInput}
                />
              </div>
              
              <div className={styles.configItem}>
                <label>Nombre de réplicas:</label>
                <select
                  value={replicas}
                  onChange={(e) => setReplicas(parseInt(e.target.value))}
                  className={styles.configSelect}
                >
                  <option value={0}>0 (aucune réplique)</option>
                  <option value={1}>1 réplique</option>
                  <option value={2}>2 répliques</option>
                  <option value={3}>3 répliques</option>
                </select>
              </div>

              <div className={styles.configItem}>
                <label>Taille cible par shard:</label>
                <select
                  value={targetShardSizeGb}
                  onChange={(e) => setTargetShardSizeGb(parseInt(e.target.value))}
                  className={styles.configSelect}
                >
                  <option value={20}>20 GB</option>
                  <option value={30}>30 GB</option>
                  <option value={50}>50 GB</option>
                  <option value={100}>100 GB</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleEstimateSize}
              disabled={estimationMutation.isPending || !mapping}
              className={styles.estimateButton}
            >
              {estimationMutation.isPending ? 'Calcul en cours...' : 'Estimer la Taille'}
            </button>
          </div>

          {estimationMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors de l'estimation de la taille:</p>
              <p>{estimationMutation.error?.message}</p>
            </div>
          )}

          {estimationMutation.data && (
            <div className={styles.results}>
              <div className={styles.summary}>
                <h4>Résultats de l'Estimation</h4>
                <p>Calculé en {estimationMutation.data.processing_time_ms}ms</p>
              </div>

              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatBytes(estimationMutation.data.estimated_doc_size_bytes)}
                  </div>
                  <div className={styles.metricLabel}>Taille moyenne par document</div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatGB(estimationMutation.data.estimated_size_gb)}
                  </div>
                  <div className={styles.metricLabel}>Taille totale des données</div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {estimationMutation.data.recommended_shards}
                  </div>
                  <div className={styles.metricLabel}>Shards recommandés</div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatGB(estimationMutation.data.total_storage_gb)}
                  </div>
                  <div className={styles.metricLabel}>Stockage total (avec réplicas)</div>
                </div>
              </div>

              <div className={styles.details}>
                <h5>Détails du stockage</h5>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Taille des données:</span>
                  <span className={styles.detailValue}>
                    {formatGB(estimationMutation.data.estimated_size_gb)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Overhead de l'index:</span>
                  <span className={styles.detailValue}>
                    {formatGB(estimationMutation.data.index_overhead_gb)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Facteur de réplication:</span>
                  <span className={styles.detailValue}>
                    {replicas + 1}x
                  </span>
                </div>
              </div>

              {estimationMutation.data.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  <h5>Recommandations</h5>
                  <ul>
                    {estimationMutation.data.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
