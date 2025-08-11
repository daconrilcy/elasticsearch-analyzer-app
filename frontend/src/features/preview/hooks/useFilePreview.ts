import { useState, useEffect, useRef, useCallback } from 'react';
import { getFile, getFilePreview, openFileStatusSSE } from '../../../lib/api/files';
import { isValidUUID, isFileOut, isFilePreviewChunk } from '../../../lib/utils/validators';
import { toCSV, downloadCSV } from '../../../lib/utils/csv';
import type { FileOut, FilePreviewChunk, FileStatusUpdate } from '../../../lib/api/types';
import type { PreviewState, ChunkNavigationState } from '../types';

export function useFilePreview(fileId: string) {
  const [previewState, setPreviewState] = useState<PreviewState>({ status: 'idle' });
  const [file, setFile] = useState<FileOut | null>(null);
  const [currentChunk, setCurrentChunk] = useState<FilePreviewChunk | null>(null);
  const [chunkState, setChunkState] = useState<ChunkNavigationState>({
    currentIndex: 0,
    chunkSize: 100,
    totalRows: 0,
    hasMore: false,
  });

  // ---- Refs pour éviter les closures obsolètes et stabiliser les callbacks
  const chunkSizeRef = useRef(100); // Valeur par défaut
  const currentIndexRef = useRef(0); // Valeur par défaut
  const hasMoreRef = useRef(false); // Valeur par défaut
  useEffect(() => { chunkSizeRef.current = chunkState.chunkSize || 100; }, [chunkState.chunkSize]);
  useEffect(() => { currentIndexRef.current = chunkState.currentIndex || 0; }, [chunkState.currentIndex]);
  useEffect(() => { hasMoreRef.current = chunkState.hasMore || false; }, [chunkState.hasMore]);

  // ---- Cache LRU (Map ordonnée)
  const cacheRef = useRef<Map<number, FilePreviewChunk>>(new Map());
  const CACHE_LIMIT = 8;
  const touchCache = (index: number, chunk: FilePreviewChunk) => {
    const c = cacheRef.current;
    if (c.has(index)) c.delete(index);
    c.set(index, chunk);
    if (c.size > CACHE_LIMIT) {
      // retire le plus ancien
      const firstKey = c.keys().next().value;
      if (firstKey !== undefined) {
        c.delete(firstKey);
      }
    }
  };

  // ---- Garde anti-race + (optionnel) AbortController
  const reqSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // ---------------- Machine à états du fichier
  useEffect(() => {
    if (!fileId) {
      setPreviewState({ status: 'idle' });
      return;
    }
    if (!isValidUUID(fileId)) {
      setPreviewState({ status: 'invalid', errorMessage: 'UUID invalide' });
      return;
    }
    setPreviewState({ status: 'loading' });
    loadFile();
    return () => {
      // cleanup requêtes / SSE
      abortRef.current?.abort();
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [fileId]);

  const loadFile = useCallback(async () => {
    try {
      const fileData = await getFile(fileId);
      if (!fileData || !isFileOut(fileData)) {
        setPreviewState({ status: 'error', errorMessage: 'Fichier introuvable ou données invalides' });
        return;
      }
      setFile(fileData);

      if (fileData.status === 'ready') {
        setPreviewState({ status: 'ready' });
        // Warm start: charge 0 et précharge 1 en parallèle
        const size = chunkSizeRef.current;
        // On appelle loadChunk et prefetch après leur définition
        setTimeout(() => {
          loadChunk(0, { size });
          prefetch(1, size);
        }, 0);
      } else if (fileData.status === 'error') {
        setPreviewState({ status: 'error', errorMessage: 'Erreur lors du traitement du fichier' });
      } else {
        openSSE();
      }
    } catch (error) {
      setPreviewState({
        status: 'error',
        errorMessage: `Erreur lors du chargement du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }, [fileId]);

  const openSSE = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    eventSourceRef.current = openFileStatusSSE(fileId, (event: FileStatusUpdate) => {
      if (event.event_type === 'status_update' && event.status) {
        setFile(prev => prev ? { ...prev, status: event.status! } : null);
        if (event.status === 'ready') {
          setPreviewState({ status: 'ready' });
          const size = chunkSizeRef.current;
          // Warm start lors du passage à ready
          setTimeout(() => {
            loadChunk(0, { size });
            prefetch(1, size);
          }, 0);
        } else if (event.status === 'error') {
          setPreviewState({ status: 'error', errorMessage: 'Erreur lors du traitement du fichier' });
        }
      } else if (event.event_type === 'parsing_error' || event.event_type === 'error') {
        setPreviewState({ status: 'error', errorMessage: event.error_message || 'Erreur lors du parsing' });
      }
    });
  }, [fileId]);

  // ---------------- Core: loadChunk + prefetch (avec garde anti-race)
  const doFetch = useCallback(async (index: number, size: number) => {
    // Si ton getFilePreview accepte AbortSignal:
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    // return await getFilePreview(fileId, index, size, { signal: abortRef.current.signal });
    return await getFilePreview(fileId, index, size);
  }, [fileId]);

  const loadChunk = useCallback(async (index: number, opts?: { size?: number }) => {
    if (index < 0) return;
    const size = opts?.size ?? chunkSizeRef.current;

    // Cache hit
    const cached = cacheRef.current.get(index);
    if (cached) {
      // Touch (LRU) et set state synchrones
      touchCache(index, cached);
      setCurrentChunk(cached);
      setChunkState(prev => ({
        ...prev,
        currentIndex: index,
        totalRows: cached.total_rows,
        hasMore: cached.has_more,
      }));
      return;
    }

    const seq = ++reqSeq.current;
    try {
      const chunk = await doFetch(index, size);
      if (!chunk || !isFilePreviewChunk(chunk)) {
        setPreviewState(prev => ({ ...prev, errorMessage: 'Prévisualisation indisponible pour ce chunk' }));
        return;
      }
      if (seq !== reqSeq.current) return; // réponse obsolète: on ignore

      touchCache(index, chunk);
      setCurrentChunk(chunk);
      setChunkState(prev => ({
        ...prev,
        currentIndex: index,
        totalRows: chunk.total_rows,
        hasMore: chunk.has_more,
      }));
    } catch (error) {
      if (seq !== reqSeq.current) return; // ignore erreurs d'anciennes requêtes
      setPreviewState(prev => ({
        ...prev,
        errorMessage: `Erreur lors du chargement du chunk: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }));
    } finally {
      // Préchargements non bloquants (et indépendants du seq courant)
      const next = index + 1;
      const prevI = index - 1;
      if (!cacheRef.current.has(next)) prefetch(next, size);
      if (prevI >= 0 && !cacheRef.current.has(prevI)) prefetch(prevI, size);
    }
  }, [doFetch]);

  const prefetch = useCallback(async (index: number, size?: number) => {
    if (index < 0) return;
    const s = size ?? chunkSizeRef.current;
    if (cacheRef.current.has(index)) return;
    try {
      const chunk = await getFilePreview(fileId, index, s);
      if (chunk && isFilePreviewChunk(chunk)) {
        // Pas de setState pendant un prefetch (on ne veut pas rerender)
        touchCache(index, chunk);
      }
    } catch { /* silencieux */ }
  }, [fileId]);

  // ---------------- Actions stables (ne dépendent pas d'un state volatile)
  const changeChunkSize = useCallback((newSize: number) => {
    // Reset contrôlé: on synchronise ref + state, on purge le cache, on charge 0 avec newSize
    chunkSizeRef.current = newSize;
    cacheRef.current.clear();
    setChunkState(prev => ({ ...prev, chunkSize: newSize }));
    Promise.allSettled([loadChunk(0, { size: newSize }), prefetch(1, newSize)]);
  }, [loadChunk, prefetch]);

  const goToPreviousChunk = useCallback(() => {
    const i = currentIndexRef.current;
    if (i > 0) loadChunk(i - 1);
  }, [loadChunk]);

  const goToNextChunk = useCallback(() => {
    const i = currentIndexRef.current;
    if (hasMoreRef.current) loadChunk(i + 1);
  }, [loadChunk]);

  const goToChunk = useCallback((index: number) => {
    if (index >= 0) loadChunk(index);
  }, [loadChunk]);

  const exportCurrentChunk = useCallback(() => {
    if (!currentChunk?.rows.length) return;
    const csvContent = toCSV(currentChunk.rows);
    const filename = `${file?.filename_original || 'export'}_chunk_${currentIndexRef.current}.csv`;
    downloadCSV(csvContent, filename);
  }, [currentChunk, file]);

  return {
    file,
    currentChunk,
    previewState,
    chunkState,
    actions: {
      loadChunk,
      prefetch,          // (exposé si tu veux déclencher côté UI)
      changeChunkSize,
      goToPreviousChunk,
      goToNextChunk,
      goToChunk,
      exportCurrentChunk,
    },
  };
}
