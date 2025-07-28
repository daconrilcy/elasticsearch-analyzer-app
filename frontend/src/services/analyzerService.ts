import { apiClient } from './apiClient';

// Définir le type pour un analyseur, en se basant sur les données attendues
export interface Analyzer {
  id: string; // ou 'name' si c'est le champ unique
  name: string;
  // Ajoutez d'autres propriétés si votre API en renvoie (ex: description, type)
}

/**
 * Gère les erreurs des réponses API qui ne sont pas 'ok'.
 * @param response La réponse de l'API.
 */
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Une erreur est survenue');
  }
};

/**
 * Service pour interagir avec les endpoints des analyseurs.
 */
class AnalyzerService {
  /**
   * Récupère la liste de tous les analyseurs disponibles (personnalisés et standards).
   * @returns Une promesse qui se résout avec une liste d'analyseurs.
   */
  async getAnalyzers(): Promise<Analyzer[]> {
    // Note: L'endpoint '/api/v1/analyzers/' est supposé.
    // Veuillez l'ajuster si le chemin est différent dans votre backend.
    const response = await apiClient('/api/v1/analyzers/', {
      method: 'GET',
    });

    await handleApiError(response);
    return response.json();
  }
}

// Exporter une instance singleton du service
export const analyzerService = new AnalyzerService();
