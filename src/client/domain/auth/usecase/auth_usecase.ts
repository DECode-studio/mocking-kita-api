import { AuthLoginResponse } from '../repository/auth_repository';
import { UserSession } from '../entity/user_session';

export interface AuthUseCase {
  getSession(): Promise<UserSession | null>;
  login(username: string, password: string, rememberMe?: boolean): Promise<AuthLoginResponse>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

