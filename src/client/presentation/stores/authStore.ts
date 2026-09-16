import { create } from 'zustand';
import { AuthLoginResponse } from '@/src/client/domain/auth/repository/auth_repository';
import { UserSession } from '@/src/client/domain/auth/entity/user_session';
import { AuthUseCase } from '@/src/client/domain/auth/usecase/auth_usecase';

let authUseCase: AuthUseCase | null = null;

export function configureAuthStore(nextAuthUseCase: AuthUseCase) {
  authUseCase = nextAuthUseCase;
}

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string, rememberMe?: boolean) => Promise<AuthLoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateSession: (partial: Partial<UserSession>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,

  login: async (username: string, pass: string, rememberMe = false) => {
    if (!authUseCase) throw new Error('Auth store is not configured');
    const res = await authUseCase.login(username, pass, rememberMe);
    if (res.success && res.session) {
      set({ session: res.session, isAuthenticated: true });
    }
    return res;
  },

  logout: async () => {
    if (!authUseCase) throw new Error('Auth store is not configured');
    await authUseCase.logout();
    set({ session: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (!authUseCase) throw new Error('Auth store is not configured');
    const session = await authUseCase.getSession();
    set({ session, isAuthenticated: !!session });
  },

  updateSession: (partial: Partial<UserSession>) => {
    set((state) => (state.session ? { session: { ...state.session, ...partial } } : {}));
  },
}));
