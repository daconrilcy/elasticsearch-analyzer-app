import { useAuthStore } from '@/features/store/authStore';

// --- CORRECTION 1 : Définir l'URL de base de votre API backend ---
// Cette variable sera préfixée à chaque appel.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


/**
 * Un client fetch "intelligent" qui ajoute automatiquement le token d'authentification
 * et l'URL de base de l'API à chaque requête.
 *
 * @param endpoint L'endpoint API (ex: '/api/v1/datasets/')
 * @param options Les options de la requête fetch (method, body, etc.)
 * @returns La réponse de la requête fetch.
 */
export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  // Récupère le token depuis le store Zustand
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // S'assure que le header Content-Type est bien défini pour les requêtes JSON
  if (options.body && typeof options.body === 'string') {
      if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
      }
  }

  // --- CORRECTION 2 : Construire l'URL complète ---
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  console.log(`Requête API vers: ${options.method || 'GET'} ${fullUrl}`); // Log pour le débogage

  const response = await fetch(fullUrl, { // Utiliser l'URL complète
    ...options,
    headers,
  });

  // Gestion centralisée des erreurs d'authentification
  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  return response;
};
