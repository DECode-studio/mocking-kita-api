import { resetDatabaseToSeed } from '@/src/core/db/database_storage_helper';
import { DatabaseResetRepository } from '@/src/domain/database/repository/database_reset_repository';

export class ResetDatabaseRepositoryImpl implements DatabaseResetRepository {
  async resetDatabase(): Promise<void> {
    resetDatabaseToSeed();
  }
}

export const resetDatabaseRepository = new ResetDatabaseRepositoryImpl();
