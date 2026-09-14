import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

export interface DatabaseSnapshotRemoteDataSource {
  getDatabaseSnapshot(): Promise<MockApiDatabase>;
  importDatabaseSnapshot(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
  resetDatabaseSnapshot(): Promise<void>;
}
