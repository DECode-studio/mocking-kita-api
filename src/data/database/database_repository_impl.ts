import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { DatabaseRepository } from '@/src/domain/database/repository/database_repository';

export class DatabaseRepositoryImpl implements DatabaseRepository {
  async resetDatabase(): Promise<void> {
    await callDatabase('resetDatabase');
  }
}

export const databaseRepository = new DatabaseRepositoryImpl();
