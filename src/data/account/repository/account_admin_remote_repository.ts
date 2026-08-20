import { Account } from '@/src/domain/account/entity/account';
import { AccountAdminRepository } from '@/src/domain/account/repository/account_admin_repository';
import { apiRequest } from '@/src/core/http-client/api-client';

export class AccountAdminRemoteRepository implements AccountAdminRepository {
  async getAll(): Promise<Account[]> {
    const res = await apiRequest<{ success: boolean; accounts: Account[] }>('/api/admin/accounts');
    if (!res.success) throw new Error('Failed to fetch accounts');
    return res.accounts;
  }

  async getSsoDomains(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; ssoDomains?: string[] }>('/api/admin/accounts');
    return res.ssoDomains || [];
  }

  async create(data: { username: string; password?: string; name: string; role: string }): Promise<Account> {
    const res = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
      method: 'POST',
      body: data,
    });
    if (!res.success) throw new Error(res.error || 'Failed to create account');
    return res.account;
  }

  async update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account> {
    const res = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
      method: 'PUT',
      body: { id, ...data },
    });
    if (!res.success) throw new Error(res.error || 'Failed to update account');
    return res.account;
  }

  async delete(id: string): Promise<void> {
    const res = await apiRequest<{ success: boolean; error?: string }>('/api/admin/accounts', {
      method: 'DELETE',
      body: { id },
    });
    if (!res.success) throw new Error(res.error || 'Failed to delete account');
  }
}
