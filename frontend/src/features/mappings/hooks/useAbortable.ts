import { useCallback, useRef } from 'react';

export function useAbortable() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const signalNext = useCallback(() => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const getCurrentSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  return {
    signalNext,
    abort,
    getCurrentSignal,
  };
}
