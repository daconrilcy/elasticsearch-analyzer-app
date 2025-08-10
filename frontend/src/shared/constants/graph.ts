// frontend/src/constants/graph.ts

import { Kind } from '@/shared/types/analyzer.d';

/**
 * Définit l'ordre logique des nœuds dans le pipeline.
 * Utilisé pour valider les connexions entre les nœuds.
 * Un nœud ne peut se connecter qu'à un nœud d'ordre supérieur ou égal.
 */
export const NODE_ORDER: Record<Kind, number> = {
  [Kind.Input]: 0,
  [Kind.CharFilter]: 1,
  [Kind.Tokenizer]: 2,
  [Kind.TokenFilter]: 3,
  [Kind.Output]: 4,
};