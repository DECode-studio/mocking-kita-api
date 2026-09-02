// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSignIn } from '@/src/presentation/views/sign-in/hook/useSignIn';
import { useAuthStore, configureAuthStore } from '@/src/presentation/stores/authStore';
import { AuthUseCase } from '@/src/domain/auth/usecase/auth_usecase';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe('useSignIn', () => {
  let mockAuthUseCase: Partial<AuthUseCase>;

  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false });
    mockAuthUseCase = {
      login: vi.fn(),
      logout: vi.fn(),
      getSession: vi.fn(),
    };
    configureAuthStore(mockAuthUseCase as AuthUseCase);
    mockReplace.mockReset();
    vi.restoreAllMocks();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useSignIn());

    expect(result.current.showPassword).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it('should toggle showPassword', () => {
    const { result } = renderHook(() => useSignIn());

    act(() => {
      result.current.setShowPassword(true);
    });

    expect(result.current.showPassword).toBe(true);
  });

  it('should handle successful login submit', async () => {
    (mockAuthUseCase.login as any).mockResolvedValue({ success: true, session: { username: 'admin' } });

    const { result } = renderHook(() => useSignIn());

    await act(async () => {
      await result.current.onSubmit({ username: 'admin', password: 'password', rememberMe: true });
    });

    expect(mockAuthUseCase.login).toHaveBeenCalledWith('admin', 'password', true);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(result.current.authError).toBeNull();
  });

  it('should set auth error on login failure', async () => {
    (mockAuthUseCase.login as any).mockResolvedValue({ success: false, error: 'Invalid password' });

    const { result } = renderHook(() => useSignIn());

    await act(async () => {
      await result.current.onSubmit({ username: 'admin', password: 'wrong' });
    });

    expect(result.current.authError).toBe('Invalid password');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should handle Google SSO popup and message completion', async () => {
    (mockAuthUseCase.getSession as any).mockResolvedValue({ username: 'sso-user' });

    const mockPopup = { closed: false };
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockPopup as any);

    const { result } = renderHook(() => useSignIn());

    act(() => {
      result.current.handleGoogleSso();
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/api/auth/sso',
      'GoogleWorkspaceSSO',
      expect.stringContaining('width=500')
    );

    // Simulate window message event 'sso-success'
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data: 'sso-success' }));
    });

    expect(mockAuthUseCase.getSession).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });
});
