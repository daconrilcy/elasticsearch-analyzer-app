import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsBanner } from '../MetricsBanner';
import { useMetrics } from '../../hooks/useMetrics';

const queryClient = new QueryClient();

// Mock du hook EXACTEMENT comme utilisé par le composant
vi.mock('../../hooks/useMetrics', () => ({ useMetrics: vi.fn() }));

describe('MetricsBanner', () => {
  it('should display metrics correctly', async () => {
    // Données alignées avec MetricsBanner.tsx
    (useMetrics as unknown as Mock).mockReturnValue({
      metrics: {
        mapping_validate_total: 25,
        mapping_validate_errors_total: {},
        mapping_compile_total: 12,
        mapping_compile_duration_seconds: { buckets: [], sum: 0, count: 0 },
        dry_run_total: 100,
        // Buckets choisis pour que le P95 = 45ms (50 + 45 >= 95)
        dry_run_duration_ms: {
          buckets: [
            { le: '10', count: 50 },
            { le: '45', count: 45 },
            { le: '100', count: 5 },
          ],
          sum: 0,
          count: 100,
        },
        dry_run_issues_total: { some: 5 }, // => hit ratio = 95.0%
        mapping_check_ids_total: 7,
        mapping_check_ids_duplicates: 0,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsBanner />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Libellés visibles
      expect(screen.getByText('Validations')).toBeInTheDocument();
      expect(screen.getByText('Compilations')).toBeInTheDocument();
      expect(screen.getByText('Dry-runs')).toBeInTheDocument();
      expect(screen.getByText('P95 Dry-run')).toBeInTheDocument();
      expect(screen.getByText('Hit ratio JSONPath')).toBeInTheDocument();
      expect(screen.getByText('IDs vérifiés')).toBeInTheDocument();

      // Valeurs
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('45ms')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (useMetrics as unknown as Mock).mockReturnValue({
      metrics: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsBanner />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Chargement des métriques/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    (useMetrics as unknown as Mock).mockReturnValue({
      metrics: null,
      loading: false,
      error: 'Failed to fetch',
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsBanner />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Erreur métriques:/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });
});
