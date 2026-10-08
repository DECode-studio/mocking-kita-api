import { Account, AccountProfile, UpdateProfileInput } from '@/src/client/domain/account/entity/account';
import { AccountRepository } from '@/src/client/domain/account/repository/account_repository';
import { apiRequest } from '@/src/core/http-client/api-client';

export class AccountRepositoryImpl implements AccountRepository {
  async getProfile(): Promise<AccountProfile> {
    const res = await apiRequest<{ success: boolean; account: AccountProfile; error?: string }>('/api/account/profile');
    if (!res.success || !res.account) {
      throw new Error(res.error || 'Failed to fetch user profile');
    }
    return res.account;
  }

  async updateProfile(input: UpdateProfileInput): Promise<{ message: string; account: AccountProfile }> {
    const res = await apiRequest<{
      success: boolean;
      message?: string;
      account?: AccountProfile;
      error?: string;
    }>('/api/account/profile', {
      method: 'PUT',
      body: input,
    });
    if (!res.success || !res.account) {
      throw new Error(res.error || 'Failed to update account profile');
    }
    return {
      message: res.message || 'Account profile updated successfully',
      account: res.account,
    };
  }

  async getAll(): Promise<Account[]> {
    const res = await apiRequest<{ success: boolean; accounts?: Account[]; error?: string }>('/api/accounts');
    if (!res.success || !res.accounts) {
      return [];
    }
    return res.accounts;
  }
}
