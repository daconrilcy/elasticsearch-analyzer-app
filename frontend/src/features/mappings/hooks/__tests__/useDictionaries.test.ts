import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDictionaries } from '../useDictionaries';

type AnyResponse = Partial<Response> & { ok: boolean; json: () => Promise<any> };

// petit utilitaire pour promesse contrôlée
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useDictionaries (Option B : propagation des erreurs)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('succès — charge les dictionnaires puis désactive loading', async () => {
    const payload = [
      { id: 'countries', name: 'Countries', created_at: '', updated_at: '' },
      { id: 'currencies', name: 'Currencies', created_at: '', updated_at: '' },
      { id: 'languages', name: 'Languages', created_at: '', updated_at: '' },
    ];

    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    } as AnyResponse);

    const { result } = renderHook(() => useDictionaries());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.dictionaries.map(d => d.id)).toEqual(
      expect.arrayContaining(['countries', 'currencies', 'languages'])
    );
  });

  it('erreur — propage un message et désactive loading', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as AnyResponse);

    const { result } = renderHook(() => useDictionaries());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();             // string non vide
    expect(typeof result.current.error).toBe('string');    // type string
    expect(result.current.dictionaries).toEqual([]);       // reset data
  });

  it('annulation — unmount avant résolution => aucun setState après unmount', async () => {
    const d = deferred<AnyResponse>();
    vi.spyOn(global, 'fetch' as any).mockReturnValue(d.promise as unknown as Response);

    const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(() => useDictionaries());
    unmount(); // on démonte immédiatement

    // on "résout" la requête après unmount
    await act(async () => {
      d.resolve({
        ok: true,
        json: async () => [],
      } as AnyResponse);
    });

    // aucun warning React (setState après unmount)
    expect(spyConsoleError).not.toHaveBeenCalled();
    spyConsoleError.mockRestore();
  });
});
