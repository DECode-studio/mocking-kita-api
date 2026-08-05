import { MockApiDatabase } from '@/src/core/db/mock-api-database';

export interface DatabaseAdminRepository {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}
