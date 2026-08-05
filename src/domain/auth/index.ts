import { authRepository } from '@/src/data/auth/repository/auth_repository';
import { AuthUseCaseImpl } from './usecase/auth_usecase';

export function createAuthUseCase() {
  return new AuthUseCaseImpl(authRepository);
}
