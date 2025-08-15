import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SizeEstimation } from '../SizeEstimation';

const queryClient = new QueryClient();

describe('SizeEstimation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the estimation form after expanding', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SizeEstimation mapping={{}} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: '+' }));

    expect(screen.getByText(/Nombre de documents/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estimer la Taille/i })).toBeInTheDocument();
  });

  it('should show estimation results after expanding', async () => {
    // Payload conforme à SizeEstimationResponse du composant
    const mockResponse = {
      estimated_size_bytes: 10240 * 1000,     // total (peu importe pour ce test)
      estimated_doc_size_bytes: 10240,        // => "10.00 KB"
      estimated_size_gb: 0.01,                // 0.01 GB
      index_overhead_gb: 0.001,               // 0.001 GB
      total_storage_gb: 0.02,                 // 0.02 GB
      recommended_shards: 1,
      recommendations: [],
      processing_time_ms: 50,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SizeEstimation mapping={{}} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: /Estimer la Taille/i }));

    // On attend l’en-tête des résultats, puis on vérifie la carte "Taille moyenne par document"
    expect(await screen.findByText(/Résultats de l'Estimation/i)).toBeInTheDocument();
    expect(screen.getByText('Taille moyenne par document')).toBeInTheDocument();
    expect(
      screen.getByText((txt) => /^10(\.0{2})?\s?KB$/.test(txt))
    ).toBeInTheDocument();

    // Optionnel : quelques autres vérifs cohérentes avec l’UI
    expect(screen.getByText('Taille totale des données')).toBeInTheDocument();
    const totalDataLabel = screen.getByText('Taille totale des données');
    const totalDataCard = totalDataLabel.parentElement as HTMLElement;
    expect(within(totalDataCard).getByText(/0\.01 GB/)).toBeInTheDocument();
    expect(screen.getByText('Shards recommandés')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
