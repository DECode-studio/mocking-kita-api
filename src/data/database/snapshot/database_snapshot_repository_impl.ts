import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DatabaseSnapshotRepository } from '@/src/domain/database/repository/database_snapshot_repository';

export class DatabaseSnapshotRepositoryImpl implements DatabaseSnapshotRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }

  async importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('importDatabase', { data, mode });
  }
}

export const databaseSnapshotRepository = new DatabaseSnapshotRepositoryImpl();
