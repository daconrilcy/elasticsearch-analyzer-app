
import { useMetrics } from '../../hooks/useMetrics';
import styles from './MetricsBanner.module.scss';

export function MetricsBanner() {
  const { metrics, loading, error, refetch } = useMetrics();

  if (loading) {
    return (
      <div className={styles.metricsBanner}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Chargement des métriques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.metricsBanner}>
        <div className={styles.error}>
          <span>❌ Erreur métriques: {error}</span>
          <button onClick={refetch} className={styles.retryButton}>
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calculer le p95 du dry-run
  const p95DryRun = calculateP95(metrics.dry_run_duration_ms.buckets);
  
  // Calculer le hit ratio JSONPath (si disponible)
  const totalDryRuns = metrics.dry_run_total;
  const totalIssues = Object.values(metrics.dry_run_issues_total).reduce((a, b) => a + b, 0);
  const hitRatio = totalDryRuns > 0 ? ((totalDryRuns - totalIssues) / totalDryRuns * 100).toFixed(1) : '0.0';

  return (
    <div className={styles.metricsBanner}>
      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Validations</span>
          <span className={styles.metricValue}>{metrics.mapping_validate_total}</span>
        </div>
        
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Compilations</span>
          <span className={styles.metricValue}>{metrics.mapping_compile_total}</span>
        </div>
        
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Dry-runs</span>
          <span className={styles.metricValue}>{metrics.dry_run_total}</span>
        </div>
        
        <div className={styles.metric}>
          <span className={styles.metricLabel}>P95 Dry-run</span>
          <span className={styles.metricValue}>{p95DryRun}ms</span>
        </div>
        
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Hit ratio JSONPath</span>
          <span className={styles.metricValue}>{hitRatio}%</span>
        </div>
        
        <div className={styles.metric}>
          <span className={styles.metricLabel}>IDs vérifiés</span>
          <span className={styles.metricValue}>{metrics.mapping_check_ids_total}</span>
        </div>
      </div>
      
      <button onClick={refetch} className={styles.refreshButton} title="Rafraîchir les métriques">
        🔄
      </button>
    </div>
  );
}

function calculateP95(buckets: Array<{ le: string; count: number }>): string {
  if (!buckets || buckets.length === 0) return 'N/A';
  
  // Trier les buckets par valeur
  const sortedBuckets = buckets.sort((a, b) => parseFloat(a.le) - parseFloat(b.le));
  
  // Calculer le total des comptages
  const totalCount = sortedBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const p95Index = Math.ceil(totalCount * 0.95);
  
  // Trouver le bucket correspondant au p95
  let cumulativeCount = 0;
  for (const bucket of sortedBuckets) {
    cumulativeCount += bucket.count;
    if (cumulativeCount >= p95Index) {
      return bucket.le;
    }
  }
  
  return 'N/A';
}
