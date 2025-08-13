import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMetrics } from '../useMetrics';

describe('useMetrics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne des métriques parsées (succès)', async () => {
    const raw = `
# HELP whatever
# TYPE whatever
mapping_validate_total 25
mapping_compile_total 12
dry_run_total 100
mapping_check_ids_total 7
mapping_check_ids_duplicates 0
`.trim();

    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => raw,
    } as Response);

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.metrics).not.toBeNull();
    expect(result.current.metrics?.mapping_validate_total).toBe(25);
    expect(result.current.metrics?.mapping_compile_total).toBe(12);
    expect(result.current.metrics?.dry_run_total).toBe(100);
    expect(result.current.metrics?.mapping_check_ids_total).toBe(7);
    expect(result.current.metrics?.mapping_check_ids_duplicates).toBe(0);
  });

  it('gère une erreur HTTP (error string)', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as Response);

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.metrics).toBeNull();
    expect(typeof result.current.error).toBe('string');
    expect(result.current.error).toContain('HTTP error! status: 500');
  });

  it('gère une erreur réseau (reject)', async () => {
    vi.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('network down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {}); // silence logs

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.metrics).toBeNull();
    expect(typeof result.current.error).toBe('string');
    expect(result.current.error).toContain('network down');

    spy.mockRestore();
  });
});
