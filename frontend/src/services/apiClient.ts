import { useAuthStore } from '@/features/store/authStore';

/**
 * Un client fetch "intelligent" qui ajoute automatiquement le token d'authentification
 * à chaque requête si l'utilisateur est connecté.
 *
 * @param url L'URL de l'endpoint API (ex: '/api/v1/projects')
 * @param options Les options de la requête fetch (method, body, etc.)
 * @returns La réponse de la requête fetch.
 */
export const apiClient = async (url: string, options: RequestInit = {}): Promise<Response> => {
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Gestion centralisée des erreurs d'authentification
  if (response.status === 401) {
    // Déconnecte l'utilisateur si le token est rejeté
    useAuthStore.getState().logout();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  return response;
};
