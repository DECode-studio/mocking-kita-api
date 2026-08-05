import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DashboardRepository } from '@/src/domain/dashboard/repository/dashboard_repository';

export class DashboardRepositoryImpl implements DashboardRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }
}

export const dashboardRepository = new DashboardRepositoryImpl();
