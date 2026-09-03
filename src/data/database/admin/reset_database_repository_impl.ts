import { DatabaseResetRepository } from '@/src/domain/database/repository/database_reset_repository';
import { resetDatabaseSnapshot } from '../api/database_snapshot_api_client';

export class ResetDatabaseRepositoryImpl implements DatabaseResetRepository {
  async resetDatabase(): Promise<void> {
    await resetDatabaseSnapshot();
  }
}

export const resetDatabaseRepository = new ResetDatabaseRepositoryImpl();
