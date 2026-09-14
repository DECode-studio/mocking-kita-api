import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountAdminRepositoryImpl } from '@/src/client/data/account/repository/account_admin_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('AccountAdminRepositoryImpl', () => {
  let repository: AccountAdminRepositoryImpl;
  const mockAccount = { id: 'acc-1', username: 'admin', name: 'Admin', role: 'ADMIN', createdAt: '', updatedAt: '' };

  beforeEach(() => {
    repository = new AccountAdminRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getAll should return accounts when response is successful', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, accounts: [mockAccount] });

    const result = await repository.getAll();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/admin/accounts');
    expect(result).toEqual([mockAccount]);
  });

  it('getAll should throw error when success is false', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: false });

    await expect(repository.getAll()).rejects.toThrow('Failed to fetch accounts');
  });

  it('getSsoDomains should return sso domains list', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, ssoDomains: ['example.com'] });

    const domains = await repository.getSsoDomains();

    expect(domains).toEqual(['example.com']);
  });

  it('create, update, and delete should call apiRequest with appropriate payload', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, account: mockAccount })
      .mockResolvedValueOnce({ success: true, account: { ...mockAccount, name: 'Updated' } })
      .mockResolvedValueOnce({ success: true });

    const created = await repository.create({ username: 'user1', name: 'User 1', role: 'USER' });
    expect(created).toEqual(mockAccount);

    const updated = await repository.update('acc-1', { name: 'Updated' });
    expect(updated.name).toBe('Updated');

    await repository.delete('acc-1');
    expect(apiClient.apiRequest).toHaveBeenLastCalledWith('/api/admin/accounts', {
      method: 'DELETE',
      body: { id: 'acc-1' },
    });
  });
});
