import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DatabaseAdminRepository } from '@/src/domain/database/repository/database_admin_repository';

export class DatabaseAdminRepositoryImpl implements DatabaseAdminRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }

  async importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('importDatabase', { data, mode });
  }
}

export const databaseAdminRepository = new DatabaseAdminRepositoryImpl();
