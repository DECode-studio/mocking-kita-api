// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore, configureAuthStore } from '@/src/presentation/stores/authStore';
import { AuthUseCase } from '@/src/domain/auth/usecase/auth_usecase';

describe('authStore', () => {
  let mockAuthUseCase: Partial<AuthUseCase>;

  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false });
    mockAuthUseCase = {
      login: vi.fn(),
      logout: vi.fn(),
      getSession: vi.fn(),
    };
    configureAuthStore(mockAuthUseCase as AuthUseCase);
  });

  afterEach(() => {
    configureAuthStore(mockAuthUseCase as AuthUseCase);
  });

  it('should handle successful login', async () => {
    const session = { username: 'admin', role: 'ADMIN' } as any;
    (mockAuthUseCase.login as any).mockResolvedValue({ success: true, session });

    const res = await useAuthStore.getState().login('admin', 'password', true);
    expect(mockAuthUseCase.login).toHaveBeenCalledWith('admin', 'password', true);
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should handle failed login', async () => {
    (mockAuthUseCase.login as any).mockResolvedValue({ success: false, error: 'Invalid creds' });

    const res = await useAuthStore.getState().login('admin', 'wrong');
    expect(res.success).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should handle logout', async () => {
    useAuthStore.setState({ session: { username: 'admin' } as any, isAuthenticated: true });
    (mockAuthUseCase.logout as any).mockResolvedValue(undefined);

    await useAuthStore.getState().logout();
    expect(mockAuthUseCase.logout).toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should handle checkAuth with active session', async () => {
    const session = { username: 'user1', role: 'USER' } as any;
    (mockAuthUseCase.getSession as any).mockResolvedValue(session);

    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should handle checkAuth without session', async () => {
    (mockAuthUseCase.getSession as any).mockResolvedValue(null);

    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should throw error when login/logout/checkAuth is called without configuration', async () => {
    configureAuthStore(null as any);
    await expect(useAuthStore.getState().login('admin', 'password')).rejects.toThrow(
      'Auth store is not configured'
    );
    await expect(useAuthStore.getState().logout()).rejects.toThrow(
      'Auth store is not configured'
    );
    await expect(useAuthStore.getState().checkAuth()).rejects.toThrow(
      'Auth store is not configured'
    );
  });
});
