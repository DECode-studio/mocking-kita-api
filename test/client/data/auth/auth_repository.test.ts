import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRepositoryImpl } from '@/src/client/data/auth/repository/auth_repository_impl';
import { AuthDataSource } from '@/src/client/data/auth/data_source/auth_data_source';

describe('AuthRepositoryImpl', () => {
  let dataSource: Partial<AuthDataSource>;
  let repository: AuthRepositoryImpl;

  const mockSession = { username: 'admin', name: 'Admin', role: 'ADMIN', token: 'tok', rememberMe: false, loginAt: '' };

  beforeEach(() => {
    dataSource = {
      getSession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: vi.fn(),
    };
    repository = new AuthRepositoryImpl(dataSource as AuthDataSource);
  });

  it('should delegate getSession, login, logout, and isAuthenticated to dataSource', async () => {
    (dataSource.getSession as any).mockResolvedValue(mockSession);
    (dataSource.login as any).mockResolvedValue({ success: true, session: mockSession });
    (dataSource.logout as any).mockResolvedValue(undefined);
    (dataSource.isAuthenticated as any).mockResolvedValue(true);

    expect(await repository.getSession()).toEqual(mockSession);
    expect(dataSource.getSession).toHaveBeenCalled();

    expect(await repository.login('admin', 'pass')).toEqual({ success: true, session: mockSession });
    expect(dataSource.login).toHaveBeenCalledWith('admin', 'pass', false);

    await repository.logout();
    expect(dataSource.logout).toHaveBeenCalled();

    expect(await repository.isAuthenticated()).toBe(true);
    expect(dataSource.isAuthenticated).toHaveBeenCalled();
  });
});
