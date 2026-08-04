import { apiRequest } from '@/src/core/http-client/api-client';

export interface UserSession {
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  token: string;
  rememberMe: boolean;
  loginAt: string;
}

type AuthResponse =
  | { success: true; session: UserSession }
  | { success: false; error: string };

export class AuthService {
  static async getSession(): Promise<UserSession | null> {
    const res = await apiRequest<{ session: UserSession | null }>('/api/auth');
    return res.session;
  }

  static async login(
    username: string,
    password: string,
    rememberMe = false
  ): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth', {
      method: 'POST',
      body: { username, password, rememberMe },
    });
  }

  static async logout(): Promise<void> {
    await apiRequest<{ success: true }>('/api/auth', {
      method: 'DELETE',
    });
  }

  static async isAuthenticated(): Promise<boolean> {
    return !!(await this.getSession());
  }
}
