import { Account } from '../entity/account';

export interface AccountRepository {
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  getByUsername(username: string): Promise<Account | null>;
  getPasswordHash(id: string): Promise<string | null>;
  create(params: {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<Account>;
  update(
    id: string,
    params: {
      username?: string;
      passwordHash?: string;
      name?: string;
      role?: string;
    }
  ): Promise<Account>;
  delete(id: string): Promise<void>;
}
