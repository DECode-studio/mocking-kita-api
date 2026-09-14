import { Account } from '../entity/account';

export interface AccountAdminUseCase {
  getAll(): Promise<Account[]>;
  getSsoDomains(): Promise<string[]>;
  create(data: { username: string; password?: string; name: string; role: string }): Promise<Account>;
  update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account>;
  delete(id: string): Promise<void>;
}

