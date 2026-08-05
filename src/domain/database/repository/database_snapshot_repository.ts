import { MockApiDatabase } from '@/src/core/db/mock-api-database';

export interface DatabaseSnapshotRepository {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}
