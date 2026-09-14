import { Account } from '@/src/client/domain/account/entity/account';

export interface AccountRemoteDataSource {
  getAll(): Promise<{ accounts: Account[]; ssoDomains: string[] }>;
  create(data: { username: string; password?: string; name: string; role: string }): Promise<Account>;
  update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account>;
  delete(id: string): Promise<void>;
}
