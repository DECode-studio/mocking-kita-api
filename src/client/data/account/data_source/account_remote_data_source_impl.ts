import { Account } from '@/src/client/domain/account/entity/account';
import { apiRequest } from '@/src/core/http-client/api-client';
import { AccountRemoteDataSource } from './account_data_source';

export class AccountRemoteDataSourceImpl implements AccountRemoteDataSource {
  async getAll(): Promise<{ accounts: Account[]; ssoDomains: string[] }> {
    const res = await apiRequest<{ success: boolean; accounts: Account[]; ssoDomains?: string[] }>('/api/admin/accounts');
    if (!res.success) throw new Error('Failed to fetch accounts');
    return {
      accounts: res.accounts,
      ssoDomains: res.ssoDomains || [],
    };
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
