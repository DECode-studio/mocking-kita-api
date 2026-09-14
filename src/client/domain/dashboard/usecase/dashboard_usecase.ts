import { DashboardSummary } from '../entity/dashboard_summary';

export interface DashboardUseCase {
  getSummary(): Promise<DashboardSummary>;
}

