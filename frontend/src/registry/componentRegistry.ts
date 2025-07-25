// Ce fichier agit comme une base de données locale pour les composants Elasticsearch.
// Il charge les fichiers JSON de configuration depuis le répertoire partagé `shared-contract`
// et fournit des fonctions pour accéder à ces définitions.

// Étape 1 : Importer le contenu brut des fichiers JSON en tant que chaînes de caractères.
// L'alias `@shared` doit être configuré dans vite.config.ts et tsconfig.app.json.
// L'suffixe `?raw` est une fonctionnalité de Vite qui importe le fichier comme du texte brut.
import tokenizersJson from '@shared/registry/_es_analyzer_tokenizer.json?raw';
import tokenFiltersJson from '@shared/registry/_es_analyzer_token_filter.json?raw';
import charFiltersJson from '@shared/registry/_es_analyzer_char_filter.json?raw';
import compatibilityJson from '@shared/registry/_es_token_filter_compatibility.json?raw';

// --- Définition des Types ---

// Un type générique pour décrire un composant (tokenizer, filtre, etc.)
export type ComponentDef = {
  name: string;
  label: string;
  description: string;
  params: any; // 'any' est utilisé car la structure des paramètres varie beaucoup
  [key: string]: any;
};

// Un type pour décrire une règle de compatibilité
type CompatibilityRule = {
  tokenizer: string;
  token_filters: {
    [key: string]: boolean | string | undefined;
  };
};

// Étape 2 : Parser les chaînes de caractères JSON en objets JavaScript.
// Cela garantit que nous avons des objets valides à manipuler dans l'application.
const tokenizersData = JSON.parse(tokenizersJson);
const tokenFiltersData = JSON.parse(tokenFiltersJson);
const charFiltersData = JSON.parse(charFiltersJson);
const compatibilityData = JSON.parse(compatibilityJson);

// --- Export des Données ---

// On exporte les listes de composants directement depuis les objets parsés.
export const availableTokenizers: ComponentDef[] = tokenizersData.tokenizers;
export const availableTokenFilters: ComponentDef[] = tokenFiltersData.token_filters;
export const availableCharFilters: ComponentDef[] = charFiltersData.char_filters;

const compatibilityRules: CompatibilityRule[] = compatibilityData.compatibility;

// --- Fonctions Utilitaires ---

/**
 * Trouve la définition complète d'un composant par son type ('kind') et son nom.
 * @param kind Le type de composant ('char_filter', 'token_filter', 'tokenizer').
 * @param name Le nom technique du composant (ex: 'stop', 'standard').
 * @returns La définition du composant trouvée, ou undefined si elle n'existe pas.
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
 * Vérifie si un token filter est compatible avec un tokenizer donné, en se basant
 * sur les règles du fichier de compatibilité.
 * @param tokenizerName Le nom du tokenizer présent dans le graphe.
 * @param tokenFilterName Le nom du token filter à vérifier.
 * @returns `true` si le filtre est compatible, `false` sinon.
 */
export function isFilterCompatible(tokenizerName: string, tokenFilterName: string): boolean {
  // Règle de base : si aucun tokenizer n'est présent, aucun filtre n'est compatible.
  if (!tokenizerName) {
    return false;
  }

  const rule = compatibilityRules.find(r => r.tokenizer === tokenizerName);

  // Si aucune règle spécifique n'est trouvée pour ce tokenizer, on l'autorise par défaut.
  if (!rule) {
    return true;
  }

  const filters = rule.token_filters;

  // 1. Vérification directe : le filtre est-il listé nommément dans la règle ?
  if (tokenFilterName in filters) {
    return filters[tokenFilterName as keyof typeof filters] === true;
  }

  // 2. Gestion des cas génériques ('*')
  if (filters['*'] === true) {
    return true;
  }
  if (filters['*'] === false) {
    return false;
  }
  
  // 3. Cas "partial" : le filtre doit être listé explicitement. Si on arrive ici, il ne l'est pas.
  return false;
}