import { create } from 'zustand';
import { AuthLoginResponse } from '@/src/domain/auth/repository/auth_repository';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { authUseCase } from '@/src/application/auth/auth_usecase';

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string, rememberMe?: boolean) => Promise<AuthLoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,

  login: async (username: string, pass: string, rememberMe = false) => {
    const res = await authUseCase.login(username, pass, rememberMe);
    if (res.success && res.session) {
      set({ session: res.session, isAuthenticated: true });
    }
    return res;
  },

  logout: async () => {
    await authUseCase.logout();
    set({ session: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const session = await authUseCase.getSession();
    set({ session, isAuthenticated: !!session });
  },
}));
