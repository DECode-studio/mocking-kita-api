import { Account } from '../entity/account';
import { AccountAdminRepository } from '../repository/account_admin_repository';

export interface AccountAdminUseCase {
  getAll(): Promise<Account[]>;
  getSsoDomains(): Promise<string[]>;
  create(data: { username: string; password?: string; name: string; role: string }): Promise<Account>;
  update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account>;
  delete(id: string): Promise<void>;
}

export class AccountAdminUseCaseImpl implements AccountAdminUseCase {
  constructor(private readonly repository: AccountAdminRepository) {}

  getAll(): Promise<Account[]> {
    return this.repository.getAll();
  }

  getSsoDomains(): Promise<string[]> {
    return this.repository.getSsoDomains();
  }

  create(data: { username: string; password?: string; name: string; role: string }): Promise<Account> {
    return this.repository.create(data);
  }

  update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account> {
    return this.repository.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
