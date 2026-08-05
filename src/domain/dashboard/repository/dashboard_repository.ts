import { MockApiDatabase } from '@/src/data/database/mock-api-database';

export interface DashboardRepository {
  getDatabase(): Promise<MockApiDatabase>;
}
