import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { DatabaseResetRepository } from '@/src/domain/database/repository/database_reset_repository';

export class ResetDatabaseRepositoryImpl implements DatabaseResetRepository {
  async resetDatabase(): Promise<void> {
    await callDatabase('resetDatabase');
  }
}

export const resetDatabaseRepository = new ResetDatabaseRepositoryImpl();
