// Ce fichier agit comme une base de données locale pour les composants Elasticsearch.
// Il charge les fichiers JSON de configuration et fournit des fonctions pour y accéder.

import tokenizersData from './data/_es_analyzer_tokenizer.json';
import tokenFiltersData from './data/_es_analyzer_token_filter.json';
import charFiltersData from './data/_es_analyzer_char_filter.json';
import compatibilityData from './data/_es_token_filter_compatibility.json';

// --- Définition des Types ---

// Un type générique pour décrire un composant (tokenizer, filtre, etc.)
export type ComponentDef = { 
  name: string; 
  label: string; 
  description: string; 
  params: any;
  [key: string]: any; 
};

// Un type pour décrire une règle de compatibilité
type CompatibilityRule = {
  tokenizer: string;
  token_filters: {
    [key: string]: boolean | string | undefined;
  };
};

// --- Export des Données ---

// On exporte les listes de composants directement depuis les fichiers JSON importés
export const availableTokenizers: ComponentDef[] = tokenizersData.tokenizers;
export const availableTokenFilters: ComponentDef[] = tokenFiltersData.token_filters;
export const availableCharFilters: ComponentDef[] = charFiltersData.char_filters;

const compatibilityRules: CompatibilityRule[] = compatibilityData.compatibility;

// --- Fonctions Utilitaires ---

/**
 * Trouve la définition complète d'un composant par son type ('kind') et son nom.
 */
export function findComponentDefinition(kind: string, name: string): ComponentDef | undefined {
  switch (kind) {
    case 'char_filter':
      return availableCharFilters.find(c => c.name === name);
    case 'token_filter':
      return availableTokenFilters.find(c => c.name === name);
    case 'tokenizer':
      return availableTokenizers.find(c => c.name === name);
    default:
      return undefined;
  }
}

/**
 * Vérifie si un token filter est compatible avec un tokenizer donné.
 */
export function isFilterCompatible(tokenizerName: string, tokenFilterName:string): boolean {
  if (!tokenizerName) {
    return false;
  }
  const rule = compatibilityRules.find(r => r.tokenizer === tokenizerName);
  if (!rule) {
    return true;
  }
  const filters = rule.token_filters;
  if (tokenFilterName in filters) {
    return filters[tokenFilterName as keyof typeof filters] === true;
  }
  if (filters['*'] === true) {
    return true;
  }
  if (filters['*'] === false) {
    return false;
  }
  return false;
}
