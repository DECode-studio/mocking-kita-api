import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DashboardRepository } from '../repository/dashboard_repository';

export interface DashboardUseCase {
  load(): Promise<MockApiDatabase>;
}

export class DashboardUseCaseImpl implements DashboardUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  load(): Promise<MockApiDatabase> {
    return this.dashboardRepository.getDatabase();
  }
}
