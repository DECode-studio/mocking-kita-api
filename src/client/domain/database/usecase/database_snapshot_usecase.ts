import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

export interface DatabaseSnapshotUseCase {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}

