import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthUseCaseImpl } from '@/src/domain/auth/usecase/auth_usecase';
import { AuthRepository } from '@/src/domain/auth/repository/auth_repository';
import { UserSession } from '@/src/domain/auth/entity/user_session';

describe('AuthUseCaseImpl', () => {
  let authRepository: Partial<AuthRepository>;
  let useCase: AuthUseCaseImpl;

  const mockSession: UserSession = {
    username: 'admin',
    name: 'Admin User',
    role: 'ADMIN',
    token: 'jwt-token',
    rememberMe: true,
    loginAt: new Date().toISOString(),
  };

  beforeEach(() => {
    authRepository = {
      getSession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: vi.fn(),
    };
    useCase = new AuthUseCaseImpl(authRepository as AuthRepository);
  });

  it('should delegate getSession to repository', async () => {
    (authRepository.getSession as any).mockResolvedValue(mockSession);

    const result = await useCase.getSession();

    expect(authRepository.getSession).toHaveBeenCalled();
    expect(result).toEqual(mockSession);
  });

  it('should delegate login to repository', async () => {
    const loginRes = { success: true, session: mockSession };
    (authRepository.login as any).mockResolvedValue(loginRes);

    const result = await useCase.login('admin', 'password', true);

    expect(authRepository.login).toHaveBeenCalledWith('admin', 'password', true);
    expect(result).toEqual(loginRes);
  });

  it('should delegate logout to repository', async () => {
    (authRepository.logout as any).mockResolvedValue(undefined);

    await useCase.logout();

    expect(authRepository.logout).toHaveBeenCalled();
  });

  it('should delegate isAuthenticated to repository', async () => {
    (authRepository.isAuthenticated as any).mockResolvedValue(true);

    const result = await useCase.isAuthenticated();

    expect(authRepository.isAuthenticated).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
