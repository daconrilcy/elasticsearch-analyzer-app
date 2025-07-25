import { useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { useAnalysisStore } from '@/features/store/analysisStore';
import { useGraphStore } from '@/features/store/graphStore';
import { Kind } from '@/shared/types/analyzer.d';

/**
 * Ce hook surveille les changements dans le texte d'entrée et la structure du graphe.
 * Lorsqu'un changement est détecté, il attend 500ms puis déclenche l'analyse,
 * à condition que le graphe soit valide (contient un tokenizer).
 */
export function useDebouncedAnalysis() {
  const { runAnalysis, inputText } = useAnalysisStore();
  const { graph } = useGraphStore();

  const debouncedAnalysis = useMemo(
    () =>
      debounce(() => {
        // L'analyse n'est pertinente que si un tokenizer est présent.
        const hasTokenizer = graph.nodes.some(node => node.data.kind === Kind.Tokenizer);
        if (!hasTokenizer) {
          console.log("Analyse ignorée : aucun tokenizer n'est présent dans le graphe.");
          return; // Ne fait rien si le graphe est incomplet
        }
        
        runAnalysis(graph);
      }, 500),
    [runAnalysis, graph]
  );

  useEffect(() => {
    debouncedAnalysis();
    return () => {
      debouncedAnalysis.cancel();
    };
  }, [inputText, graph, debouncedAnalysis]);
}
