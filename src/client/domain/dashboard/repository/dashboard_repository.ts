import { DashboardSummary } from '../entity/dashboard_summary';

export interface DashboardRepository {
  getDashboardSummary(): Promise<DashboardSummary>;
}
