import { UserSession } from '../entity/user_session';

export type AuthLoginResponse =
  | { success: true; session: UserSession }
  | { success: false; error: string };

export interface AuthRepository {
  getSession(): Promise<UserSession | null>;
  login(username: string, password: string, rememberMe?: boolean): Promise<AuthLoginResponse>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}
