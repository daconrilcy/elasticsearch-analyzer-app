import { useState, useEffect } from 'react';

export interface MetricsData {
  mapping_validate_total: number;
  mapping_validate_errors_total: Record<string, number>;
  mapping_compile_total: number;
  mapping_compile_duration_seconds: {
    buckets: Array<{ le: string; count: number }>;
    sum: number;
    count: number;
  };
  dry_run_total: number;
  dry_run_duration_ms: {
    buckets: Array<{ le: string; count: number }>;
    sum: number;
    count: number;
  };
  dry_run_issues_total: Record<string, number>;
  mapping_check_ids_total: number;
  mapping_check_ids_duplicates: number;
}

export function useMetrics(): {
  metrics: MetricsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      
      // Parser les métriques Prometheus
      const parsedMetrics = parsePrometheusMetrics(data);
      setMetrics(parsedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Metrics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
}

function parsePrometheusMetrics(rawMetrics: string): MetricsData {
  const lines = rawMetrics.split('\n');
  const metrics: Partial<MetricsData> = {};
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    // Parser les métriques simples (counters)
    if (line.includes('mapping_validate_total')) {
      const match = line.match(/mapping_validate_total (\d+)/);
      if (match) metrics.mapping_validate_total = parseInt(match[1]);
    }
    
    if (line.includes('mapping_compile_total')) {
      const match = line.match(/mapping_compile_total (\d+)/);
      if (match) metrics.mapping_compile_total = parseInt(match[1]);
    }
    
    if (line.includes('dry_run_total')) {
      const match = line.match(/dry_run_total (\d+)/);
      if (match) metrics.dry_run_total = parseInt(match[1]);
    }
    
    if (line.includes('mapping_check_ids_total')) {
      const match = line.match(/mapping_check_ids_total (\d+)/);
      if (match) metrics.mapping_check_ids_total = parseInt(match[1]);
    }
    
    if (line.includes('mapping_check_ids_duplicates')) {
      const match = line.match(/mapping_check_ids_duplicates (\d+)/);
      if (match) metrics.mapping_check_ids_duplicates = parseInt(match[1]);
    }
  }
  
  // Valeurs par défaut pour les métriques non trouvées
  return {
    mapping_validate_total: metrics.mapping_validate_total || 0,
    mapping_validate_errors_total: {},
    mapping_compile_total: metrics.mapping_compile_total || 0,
    mapping_compile_duration_seconds: { buckets: [], sum: 0, count: 0 },
    dry_run_total: metrics.dry_run_total || 0,
    dry_run_duration_ms: { buckets: [], sum: 0, count: 0 },
    dry_run_issues_total: {},
    mapping_check_ids_total: metrics.mapping_check_ids_total || 0,
    mapping_check_ids_duplicates: metrics.mapping_check_ids_duplicates || 0
  };
}
