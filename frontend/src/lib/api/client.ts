const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000/api/v1';

export async function httpJson<T = any>(
  path: string, 
  init: RequestInit = {}
): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    console.log('Requête HTTP vers:', url);
    
    const response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    console.log('Réponse HTTP:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}: ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    // Gestion des réponses vides
    const text = await response.text();
    if (!text.trim()) {
      console.log('Réponse vide reçue');
      return null;
    }

    try {
      const data = JSON.parse(text) as T;
      console.log('Données parsées:', data);
      return data;
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError, 'Texte reçu:', text);
      throw new Error(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Erreur de requête HTTP:', error);
    throw error; // Propager l'erreur au lieu de retourner null
  }
}

export function createEventSource(url: string): EventSource {
  const eventSource = new EventSource(url, { withCredentials: true });
  return eventSource;
}

