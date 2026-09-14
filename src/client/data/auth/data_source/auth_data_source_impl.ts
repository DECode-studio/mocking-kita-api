import { apiRequest } from '@/src/core/http-client/api-client';
import { AuthDataSource } from './auth_data_source';
import { UserSession } from '@/src/client/domain/auth/entity/user_session';
import { AuthLoginResponse } from '@/src/client/domain/auth/repository/auth_repository';

export class AuthRemoteDataSourceImpl implements AuthDataSource {
  async getSession(): Promise<UserSession | null> {
    const res = await apiRequest<{ session: UserSession | null }>('/api/auth');
    return res.session;
  }

  async login(username: string, password: string, rememberMe = false): Promise<AuthLoginResponse> {
    return apiRequest<AuthLoginResponse>('/api/auth', {
      method: 'POST',
      body: { username, password, rememberMe },
    });
  }

  async logout(): Promise<void> {
    await apiRequest<{ success: true }>('/api/auth', {
      method: 'DELETE',
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return !!(await this.getSession());
  }
}
