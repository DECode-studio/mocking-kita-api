import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';

export interface DashboardRemoteDataSource {
  getDashboardSummary(): Promise<DashboardSummary>;
}
