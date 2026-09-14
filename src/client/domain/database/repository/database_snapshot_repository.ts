import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

export interface DatabaseSnapshotRepository {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}
