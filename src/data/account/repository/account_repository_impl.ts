import { Account } from '@/src/domain/account/entity/account';
import { AccountRepository } from '@/src/domain/account/repository/account_repository';
import { apiRequest } from '@/src/core/http-client/api-client';

export class AccountRepositoryImpl implements AccountRepository {
  async getAll(): Promise<Account[]> {
    const response = await apiRequest<{ success: boolean; accounts: Account[]; error?: string }>('/api/admin/accounts');
    if (!response.success) throw new Error(response.error || 'Failed to fetch accounts');
    return response.accounts;
  }

  async getById(id: string): Promise<Account | null> {
    const accounts = await this.getAll();
    return accounts.find((account) => account.id === id) || null;
  }

  async getByUsername(username: string): Promise<Account | null> {
    const accounts = await this.getAll();
    return accounts.find((account) => account.username === username.toLowerCase()) || null;
  }

  async getPasswordHash(_id: string): Promise<string | null> {
    throw new Error('getPasswordHash is server-only');
  }

  async create(params: {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<Account> {
    const response = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
      method: 'POST',
      body: {
        username: params.username,
        password: params.passwordHash,
        name: params.name,
        role: params.role,
      },
    });
    if (!response.success) throw new Error(response.error || 'Failed to create account');
    return response.account;
  }

  async update(
    id: string,
    params: {
      username?: string;
      passwordHash?: string;
      name?: string;
      role?: string;
    }
  ): Promise<Account> {
    const response = await apiRequest<{ success: boolean; account: Account; error?: string }>('/api/admin/accounts', {
      method: 'PUT',
      body: {
        id,
        username: params.username,
        password: params.passwordHash,
        name: params.name,
        role: params.role,
      },
    });
    if (!response.success) throw new Error(response.error || 'Failed to update account');
    return response.account;
  }

  async delete(id: string): Promise<void> {
    const response = await apiRequest<{ success: boolean; error?: string }>('/api/admin/accounts', {
      method: 'DELETE',
      body: { id },
    });
    if (!response.success) throw new Error(response.error || 'Failed to delete account');
  }
}

export const accountRepository = new AccountRepositoryImpl();
