import { create } from 'zustand';
import { authService, type AuthCredentials, type RegisterCredentials, type User } from '@/services/authService';

// L'interface qui définit la "forme" de notre store
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>; // <-- La propriété manquante est ici
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: AuthCredentials) => {
    const authResponse = await authService.login(credentials);
    const { access_token } = authResponse;
    
    const user = await authService.getCurrentUser(access_token);
    
    localStorage.setItem('authToken', access_token);
    set({ token: access_token, user, isAuthenticated: true });
  },

  // L'implémentation de la fonction register
  register: async (credentials: RegisterCredentials) => {
    await authService.register(credentials);
    // Après une inscription réussie, on connecte directement l'utilisateur
    await get().login({ username: credentials.username, password: credentials.password });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const user = await authService.getCurrentUser(token);
        set({ token, user, isAuthenticated: true });
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      set({ token: null, user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
