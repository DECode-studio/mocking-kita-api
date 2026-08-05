import { MockApiDatabase } from '@/src/core/db/mock-api-database';

export interface DashboardRepository {
  getDatabase(): Promise<MockApiDatabase>;
}
