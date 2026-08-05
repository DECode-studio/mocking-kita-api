import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DashboardRepository } from '@/src/domain/dashboard/repository/dashboard_repository';
import { dashboardRepository } from '@/src/data/database/dashboard/database_repository_impl';

export interface DashboardUseCase {
  load(): Promise<MockApiDatabase>;
}

export class DashboardUseCaseInteractor implements DashboardUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  load(): Promise<MockApiDatabase> {
    return this.dashboardRepository.getDatabase();
  }
}

export const dashboardUseCase = new DashboardUseCaseInteractor(dashboardRepository);
