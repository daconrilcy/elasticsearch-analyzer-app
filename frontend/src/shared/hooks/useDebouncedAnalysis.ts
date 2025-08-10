import { useEffect, useMemo, useRef } from 'react'; // useRef est ajouté
import debounce from 'lodash.debounce';
import { useAnalysisStore, useGraphStore } from '@shared/lib';
import { Kind } from '@shared/types/analyzer.d';

/**
 * Ce hook surveille les changements dans le texte d'entrée et la structure du graphe.
 * Il ignore les changements de position des nœuds pour éviter les analyses inutiles.
 */
export function useDebouncedAnalysis() {
  const { runAnalysis, inputText } = useAnalysisStore();
  const { graph } = useGraphStore();
  
  // --- CORRECTION : Utilisation d'une ref pour accéder au dernier état du graphe ---
  // Cela permet à notre fonction débouncée de ne pas être recréée à chaque render,
  // tout en ayant accès à la version la plus récente du graphe.
  const graphRef = useRef(graph);
  useEffect(() => {
    graphRef.current = graph;
  }, [graph]);

  // On crée une représentation "stable" du graphe qui ignore les positions.
  // Ce sera la dépendance de notre effet principal.
  const analysisRelevantGraphString = useMemo(() => {
    const simplifiedNodes = graph.nodes.map(({ id, data }) => ({ id, data }));
    const simplifiedEdges = graph.edges.map(({ id, source, target }) => ({ id, source, target }));
    return JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges });
  }, [graph.nodes, graph.edges]);

  // La fonction débouncée est maintenant créée une seule fois et ne dépend plus du graphe.
  const debouncedAnalysis = useMemo(
    () =>
      debounce(() => {
        // Elle lit la version la plus à jour du graphe via la ref.
        const currentGraph = graphRef.current;
        const hasTokenizer = currentGraph.nodes.some(node => node.data.kind === Kind.Tokenizer);
        if (!hasTokenizer) {
          return;
        }
        runAnalysis(currentGraph);
      }, 500),
    [runAnalysis] // Le tableau de dépendances est maintenant stable.
  );

  // Cet effet se déclenche uniquement lorsque le texte ou la structure du graphe change.
  useEffect(() => {
    debouncedAnalysis();
    return () => {
      debouncedAnalysis.cancel();
    };
  }, [inputText, analysisRelevantGraphString, debouncedAnalysis]);
} 