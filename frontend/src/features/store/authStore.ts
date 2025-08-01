import { create } from 'zustand';
// --- CORRECTION : Import des fonctions API nécessaires ---
import { 
    login as apiLogin, 
    register as apiRegister, 
    getCurrentUser,
    logout as apiLogout // Assurez-vous d'avoir une fonction logout dans votre apiClient
} from '@/features/apiClient';
import type { AuthCredentials, RegisterCredentials, User } from '@/types/api.v1';

// L'interface qui définit la "forme" de notre store
interface AuthState {
  // Le token n'est plus stocké côté client
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>; // Logout est maintenant une opération asynchrone
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // L'application commence en état de chargement

  login: async (credentials: AuthCredentials) => {
    // 1. Appelle l'API de login. Le backend s'occupe de poser le cookie.
    await apiLogin(credentials);
    // 2. Récupère les informations de l'utilisateur pour mettre à jour l'état de l'UI.
    const user = await getCurrentUser();
    set({ user, isAuthenticated: true });
  },

  register: async (credentials: RegisterCredentials) => {
    await apiRegister(credentials);
    // Après l'inscription, on connecte directement l'utilisateur.
    await get().login({ username: credentials.username, password: credentials.password });
  },

  logout: async () => {
    // Appelle le backend pour qu'il supprime le cookie HttpOnly.
    await apiLogout();
    // Met à jour l'état de l'application pour refléter la déconnexion.
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Tente de récupérer l'utilisateur. Si l'utilisateur a un cookie valide,
      // cette requête réussira.
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      // Si la requête échoue (ex: 401 Unauthorized), cela signifie que l'utilisateur
      // n'est pas connecté. On s'assure que l'état est propre.
      set({ user: null, isAuthenticated: false });
    } finally {
      // Dans tous les cas, le chargement initial est terminé.
      set({ isLoading: false });
    }
  },
}));