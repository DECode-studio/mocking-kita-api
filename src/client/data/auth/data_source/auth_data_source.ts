import { UserSession } from '@/src/client/domain/auth/entity/user_session';
import { AuthLoginResponse } from '@/src/client/domain/auth/repository/auth_repository';

export interface AuthDataSource {
  getSession(): Promise<UserSession | null>;
  login(username: string, password: string, rememberMe?: boolean): Promise<AuthLoginResponse>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}
