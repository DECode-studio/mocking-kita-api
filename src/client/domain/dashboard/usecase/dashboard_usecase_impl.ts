import { DashboardSummary } from '../entity/dashboard_summary';
import { DashboardRepository } from '../repository/dashboard_repository';
import { DashboardUseCase } from './dashboard_usecase';

export class DashboardUseCaseImpl implements DashboardUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getSummary(): Promise<DashboardSummary> {
    return this.dashboardRepository.getDashboardSummary();
  }
}
