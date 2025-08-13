import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TypeInference } from '../TypeInference';

const queryClient = new QueryClient();

const sampleData = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

describe('TypeInference', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the inference button after expanding', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TypeInference sampleData={sampleData} onTypesApplied={vi.fn()} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByRole('button', { name: /Inférer les Types/i })).toBeInTheDocument();
  });

  it('should display inference results after expanding', async () => {
    const onTypesApplied = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          inferred_types: [
            {
              field: 'name',
              suggested_type: 'keyword',
              confidence: 0.9,
              sample_values: ['Alice', 'Bob'],
              reasoning: 'Looks like a name',
            },
            {
              field: 'age',
              suggested_type: 'integer',
              confidence: 0.85,
              sample_values: ['30', '25'],
              reasoning: 'Numeric values',
            },
          ],
          total_fields: 2,
          processing_time_ms: 12,
        }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TypeInference sampleData={sampleData} onTypesApplied={onTypesApplied} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: /Inférer les Types/i }));

    expect(await screen.findByText(/Résultats de l'Inférence/i)).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('keyword')).toBeInTheDocument();

    // Optionnel: vérifier l’application
    await userEvent.click(screen.getByRole('button', { name: /Appliquer les Types Inférés/i }));
    expect(onTypesApplied).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.objectContaining({ es_type: 'keyword' }),
        age: expect.objectContaining({ es_type: 'integer' }),
      })
    );
  });
});
