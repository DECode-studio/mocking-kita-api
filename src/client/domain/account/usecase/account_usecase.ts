import { Account, AccountProfile, UpdateProfileInput } from '../entity/account';

export interface AccountUseCase {
  getProfile(): Promise<AccountProfile>;
  updateProfile(input: UpdateProfileInput): Promise<{ message: string; account: AccountProfile }>;
  getAll(): Promise<Account[]>;
}
