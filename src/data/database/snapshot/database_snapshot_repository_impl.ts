import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { DatabaseSnapshotRepository } from '@/src/domain/database/repository/database_snapshot_repository';
import { getDatabaseSnapshot, importDatabaseSnapshot } from '../api/database_snapshot_api_client';

export class DatabaseSnapshotRepositoryImpl implements DatabaseSnapshotRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return getDatabaseSnapshot();
  }

  async importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return importDatabaseSnapshot(data, mode);
  }
}

export const databaseSnapshotRepository = new DatabaseSnapshotRepositoryImpl();
