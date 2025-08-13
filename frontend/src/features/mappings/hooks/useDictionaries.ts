import { useCallback, useEffect, useState } from 'react';

export interface Dictionary {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UseDictionariesResult {
  dictionaries: Dictionary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Récupère la liste des dictionnaires via HTTP.
 * - Propage l'erreur réseau dans `error` (string).
 * - Remet `dictionaries` à [] en cas d'échec.
 * - Protège contre les setState après unmount (AbortController + guards).
 */
export function useDictionaries(): UseDictionariesResult {
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDictionaries = useCallback(
    async (signal?: AbortSignal) => {
      // reset state de cycle
      if (!signal?.aborted) {
        setLoading(true);
        setError(null);
      }

      try {
        const base = (import.meta as any)?.env?.VITE_API_BASE ?? '';
        const url = `${base}/dictionaries`;

        const res = await fetch(url, { signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as Dictionary[];
        if (!signal?.aborted) {
          setDictionaries(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (signal?.aborted) return; // pas de setState après unmount
        setDictionaries([]);
        setError(e?.message ?? String(e));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchDictionaries(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchDictionaries]);

  const refetch = useCallback(async () => {
    const ctrl = new AbortController();
    await fetchDictionaries(ctrl.signal);
  }, [fetchDictionaries]);

  return { dictionaries, loading, error, refetch };
}
