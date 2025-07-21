import { useEffect, useMemo } from 'react';
import { useFlowEditorStore, type FlowEditorState } from '../features/store';
import debounce from 'lodash.debounce';

/**
 * Ce hook surveille les changements dans le texte d'entrée et la structure du graphe.
 * Lorsqu'un changement est détecté, il attend 500ms que l'utilisateur ait fini
 * ses modifications, puis déclenche automatiquement l'analyse.
 */
export function useDebouncedAnalysis() {
  // Sélection explicite et typée
  const analyze = useFlowEditorStore((state: FlowEditorState) => state.analyze);
  const graph = useFlowEditorStore((state: FlowEditorState) => state.graph);
  const inputText = useFlowEditorStore((state: FlowEditorState) => state.inputText);

  const debouncedAnalysis = useMemo(
    () => debounce(() => {
      analyze();
    }, 500),
    [analyze]
  );

  useEffect(() => {
    debouncedAnalysis();
    return () => {
      debouncedAnalysis.cancel();
    };
  }, [inputText, graph, debouncedAnalysis]);
}
