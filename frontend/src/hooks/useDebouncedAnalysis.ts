import { useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { useAnalysisStore } from '@/features/store/analysisStore';
import { useGraphStore } from '@/features/store/graphStore';

/**
 * Ce hook surveille les changements dans le texte d'entrée et la structure du graphe.
 * Lorsqu'un changement est détecté, il attend 500ms puis déclenche l'analyse.
 */
export function useDebouncedAnalysis() {
  // Sélectionne les états et actions depuis les stores spécialisés
  const { runAnalysis, inputText } = useAnalysisStore();
  const { graph } = useGraphStore();

  const debouncedAnalysis = useMemo(
    () =>
      debounce(() => {
        // Le graphe est maintenant passé en argument à l'action
        runAnalysis(graph);
      }, 500),
    [runAnalysis, graph] // `graph` doit être dans les dépendances
  );

  useEffect(() => {
    debouncedAnalysis();
    return () => {
      debouncedAnalysis.cancel();
    };
  }, [inputText, graph, debouncedAnalysis]);
}