import { Account } from '@/src/client/domain/account/entity/account';
import { AccountAdminRepository } from '@/src/client/domain/account/repository/account_admin_repository';
import { AccountRemoteDataSource } from '../data_source/account_data_source';
import { AccountRemoteDataSourceImpl } from '../data_source/account_remote_data_source_impl';

export class AccountAdminRepositoryImpl implements AccountAdminRepository {
  constructor(private dataSource: AccountRemoteDataSource = new AccountRemoteDataSourceImpl()) {}

  async getAll(): Promise<Account[]> {
    const data = await this.dataSource.getAll();
    return data.accounts;
  }

  async getSsoDomains(): Promise<string[]> {
    const data = await this.dataSource.getAll();
    return data.ssoDomains;
  }

  async create(data: { username: string; password?: string; name: string; role: string }): Promise<Account> {
    return this.dataSource.create(data);
  }

  async update(id: string, data: { username?: string; password?: string; name?: string; role?: string }): Promise<Account> {
    return this.dataSource.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.dataSource.delete(id);
  }
}
