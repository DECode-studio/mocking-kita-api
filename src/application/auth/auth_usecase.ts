import { AuthUseCaseImpl } from '@/src/domain/auth/usecase/auth_usecase';
import { authRepository } from '@/src/infrastructure/auth/auth_repository';

export const authUseCase = new AuthUseCaseImpl(authRepository);
