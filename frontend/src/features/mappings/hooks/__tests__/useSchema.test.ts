import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

type AnyResponse = {
  status: number;
  json?: () => Promise<any>;
  headers?: { get: (k: string) => string | null };
};

// helper: réinitialise les modules, stub l'env, puis importe les hooks
async function loadHooks() {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE', 'http://test'); // << base complète
  return await import('../useSchema');
}

describe('useSchema', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    (global as any).fetch = mockFetch;
    mockFetch.mockReset();
  });

  it('fetch le schéma (200) et extrait version/types/ops', async () => {
    const schema200 = {
      $id: '2-2.schema.json',
      properties: {
        fields: {
          items: {
            properties: {
              type: { enum: ['text', 'keyword', 'nested', 'object'] },
              pipeline: {
                items: {
                  oneOf: [{ $ref: '#/$defs/OpTrim' }, { $ref: '#/$defs/OpCast' }],
                },
              },
            },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => schema200,
      headers: { get: (k: string) => (k.toLowerCase() === 'etag' ? 'W/"etag-1"' : null) },
    } as AnyResponse);

    const { useSchema } = await loadHooks();
    const { result } = renderHook(() => useSchema());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // URL attendue = `${VITE_API_BASE}/api/v1/mappings/schema`
    expect(mockFetch).toHaveBeenCalledWith('http://test/api/v1/mappings/schema', expect.any(Object));

    expect(result.current.error).toBeNull();
    expect(result.current.offline).toBe(false);
    expect(result.current.version).toBe('2-2');
    expect(result.current.fieldTypes).toEqual(['text', 'keyword']); // nested/object filtrés
    expect(result.current.operations).toEqual(['trim', 'cast']);
    expect(result.current.etag).toBe('W/"etag-1"');
    expect(result.current.updated).toBe(false); // premier chargement
  });

  it('304 → réutilise le cache et updated=false (If-None-Match présent)', async () => {
    // 1er appel: 200 + cache
    const schema200 = { $id: '2-2.schema.json' };
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => schema200,
      headers: { get: (k: string) => (k.toLowerCase() === 'etag' ? 'W/"etag-1"' : null) },
    } as AnyResponse);

    const { useSchema } = await loadHooks();
    const { result } = renderHook(() => useSchema());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 2e appel: 304
    mockFetch.mockResolvedValueOnce({
      status: 304,
      headers: { get: () => null },
    } as AnyResponse);

    await act(async () => {
      await result.current.reload(); // pas de force → envoie If-None-Match
    });

    // On a rappelé fetch avec l’en-tête If-None-Match
    const [, secondOpts] = mockFetch.mock.calls[1];
    const ifNoneMatch =
      (secondOpts as any)?.headers?.['If-None-Match'] ??
      (secondOpts as any)?.headers?.get?.('If-None-Match');
    expect(ifNoneMatch).toBe('W/"etag-1"');

    expect(result.current.error).toBeNull();
    expect(result.current.updated).toBe(false);
    expect(result.current.version).toBe('2-2'); // resté sur le cache
  });

  it('200 avec ETAG différent → updated=true', async () => {
    // 1er: 200 (etag-1)
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ $id: '2-2.schema.json' }),
      headers: { get: (k: string) => (k.toLowerCase() === 'etag' ? 'W/"etag-1"' : null) },
    } as AnyResponse);

    const { useSchema } = await loadHooks();
    const { result } = renderHook(() => useSchema());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 2e: 200 (etag-2) → updated = true car If-None-Match envoyé avec etag-1
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ $id: '2-2.schema.json' }),
      headers: { get: (k: string) => (k.toLowerCase() === 'etag' ? 'W/"etag-2"' : null) },
    } as AnyResponse);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.updated).toBe(true);
    expect(result.current.etag).toBe('W/"etag-2"');
  });

  it('offline (erreur réseau) → flag offline + message adéquat sans cache', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const { useSchema } = await loadHooks();
    const { result } = renderHook(() => useSchema());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.offline).toBe(true);
    expect(result.current.error).toBe('Mode hors ligne - aucun schéma en cache disponible');
    expect(result.current.schema).toBeNull();
  });
});
