import { AuthRepository, AuthLoginResponse } from '../repository/auth_repository';
import { UserSession } from '../entity/user_session';
import { AuthUseCase } from './auth_usecase';

export class AuthUseCaseImpl implements AuthUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  getSession(): Promise<UserSession | null> {
    return this.authRepository.getSession();
  }

  login(username: string, password: string, rememberMe = false): Promise<AuthLoginResponse> {
    return this.authRepository.login(username, password, rememberMe);
  }

  logout(): Promise<void> {
    return this.authRepository.logout();
  }

  isAuthenticated(): Promise<boolean> {
    return this.authRepository.isAuthenticated();
  }
}
