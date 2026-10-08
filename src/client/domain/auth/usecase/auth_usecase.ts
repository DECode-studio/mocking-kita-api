import { UserSession, AuthLoginResponse } from '../entity/user_session';

export type { AuthLoginResponse };

export interface AuthUseCase {
  getSession(): Promise<UserSession | null>;
  login(username: string, password: string, rememberMe?: boolean): Promise<AuthLoginResponse>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}


