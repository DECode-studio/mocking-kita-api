import { create } from 'zustand';
import { AuthService, UserSession } from '../../data/resources/remote/auth-api-service';

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,

  login: async (username: string, pass: string, rememberMe = false) => {
    const res = await AuthService.login(username, pass, rememberMe);
    if (res.success && res.session) {
      set({ session: res.session, isAuthenticated: true });
    }
    return res;
  },

  logout: async () => {
    await AuthService.logout();
    set({ session: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const session = await AuthService.getSession();
    set({ session, isAuthenticated: !!session });
  },
}));
