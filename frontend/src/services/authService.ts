// frontend/src/services/authService.ts

// Interfaces pour les données envoyées et reçues
export interface AuthCredentials {
    username: string;
    password: string;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
  }
  
  export interface User {
    id: number;
    username: string;
    email: string;
  }

  export interface RegisterCredentials extends AuthCredentials {
    email: string;
  }
  
  
  const API_BASE_URL = '/api/v1/auth';
  
  export const authService = {
    /**
     * Tente de connecter un utilisateur.
     * @param credentials Les identifiants de l'utilisateur.
     * @returns La réponse de l'API contenant le token.
     */
    async login(credentials: AuthCredentials): Promise<AuthResponse> {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');
      }
      return response.json();
    },

    /**
   * Crée un nouvel utilisateur.
   * @param credentials Les informations du nouvel utilisateur.
   * @returns Les informations de l'utilisateur créé.
   */
    async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'inscription.');
    }
    return response.json();
    },
  
    /**
     * Récupère les informations de l'utilisateur actuellement connecté.
     * @param token Le token JWT de l'utilisateur.
     * @returns Les informations de l'utilisateur.
     */
    async getCurrentUser(token: string): Promise<User> {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Session invalide ou expirée.');
      }
      return response.json();
    },
    
    // Vous pouvez ajouter ici la fonction register sur le même modèle
  };  