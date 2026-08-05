import { AuthDataSource } from '@/src/data/auth/data_source/auth_data_source';
import { authDataSource } from '@/src/data/auth/data_source/auth_data_source_impl';
import { AuthRepository } from '@/src/domain/auth/repository/auth_repository';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { AuthLoginResponse } from '@/src/domain/auth/repository/auth_repository';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly dataSource: AuthDataSource = authDataSource) {}

  async getSession(): Promise<UserSession | null> {
    return this.dataSource.getSession();
  }

  async login(username: string, password: string, rememberMe = false): Promise<AuthLoginResponse> {
    return this.dataSource.login(username, password, rememberMe);
  }

  async logout(): Promise<void> {
    await this.dataSource.logout();
  }

  async isAuthenticated(): Promise<boolean> {
    return this.dataSource.isAuthenticated();
  }
}

export const authRepository = new AuthRepositoryImpl();
