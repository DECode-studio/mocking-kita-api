import { Account, AccountProfile, UpdateProfileInput } from '../entity/account';
import { AccountRepository } from '../repository/account_repository';
import { AccountUseCase } from './account_usecase';

export class AccountUseCaseImpl implements AccountUseCase {
  constructor(private repository: AccountRepository) {}

  async getProfile(): Promise<AccountProfile> {
    return this.repository.getProfile();
  }

  async updateProfile(input: UpdateProfileInput): Promise<{ message: string; account: AccountProfile }> {
    return this.repository.updateProfile(input);
  }

  async getAll(): Promise<Account[]> {
    return this.repository.getAll();
  }
}
