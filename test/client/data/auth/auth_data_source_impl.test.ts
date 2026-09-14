import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRemoteDataSourceImpl } from '@/src/client/data/auth/data_source/auth_data_source_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('AuthRemoteDataSourceImpl', () => {
  let dataSource: AuthRemoteDataSourceImpl;
  const mockSession = { username: 'admin', name: 'Admin', role: 'ADMIN', token: 'token', rememberMe: true, loginAt: '' };

  beforeEach(() => {
    dataSource = new AuthRemoteDataSourceImpl();
    vi.restoreAllMocks();
  });

  it('getSession should return user session from /api/auth', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ session: mockSession });

    const session = await dataSource.getSession();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/auth');
    expect(session).toEqual(mockSession);
  });

  it('login should send POST to /api/auth with username and password', async () => {
    const loginRes = { success: true, session: mockSession };
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(loginRes);

    const result = await dataSource.login('admin', 'password', true);

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/auth', {
      method: 'POST',
      body: { username: 'admin', password: 'password', rememberMe: true },
    });
    expect(result).toEqual(loginRes);
  });

  it('logout should send DELETE to /api/auth', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true });

    await dataSource.logout();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/auth', { method: 'DELETE' });
  });

  it('isAuthenticated should return boolean based on session existence', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ session: mockSession });
    expect(await dataSource.isAuthenticated()).toBe(true);

    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ session: null });
    expect(await dataSource.isAuthenticated()).toBe(false);
  });
});
