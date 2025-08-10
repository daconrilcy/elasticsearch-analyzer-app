import { useCallback } from 'react';
import { type Connection } from 'reactflow';
import toast from 'react-hot-toast';
import { useGraphStore } from '@shared/lib';
import { NODE_ORDER } from '@shared/constants/graph';
import { isFilterCompatible } from '@shared/lib';
import { Kind } from '@shared/types/analyzer.d';

export function useConnectionValidation() {
  const { graph } = useGraphStore();

  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const sourceNode = graph.nodes.find(node => node.id === connection.source);
      const targetNode = graph.nodes.find(node => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      // Règle 1: Valider l'ordre des nœuds (ex: un tokenizer ne peut pas précéder un char_filter)
      const sourceOrder = NODE_ORDER[sourceNode.data.kind];
      const targetOrder = NODE_ORDER[targetNode.data.kind];

      if (targetOrder < sourceOrder) {
        toast.error(`Connexion invalide : un '${sourceNode.data.kind}' doit précéder un '${targetNode.data.kind}'.`);
        return false;
      }

      // Règle 2: Valider la compatibilité spécifique des Token Filters
      if (targetNode.data.kind === Kind.TokenFilter) {
        const tokenizerNode = graph.nodes.find(n => n.data.kind === Kind.Tokenizer);
        
        if (!tokenizerNode) {
          toast.error("Veuillez ajouter un tokenizer avant de connecter un filtre de token.");
          return false;
        }

        if (!isFilterCompatible(tokenizerNode.data.name, targetNode.data.name)) {
          toast.error(`Le filtre '${targetNode.data.name}' n'est pas compatible avec le tokenizer '${tokenizerNode.data.name}'.`);
          return false;
        }
      }

      return true;
    },
    [graph.nodes]
  );

  return { isValidConnection };
}
