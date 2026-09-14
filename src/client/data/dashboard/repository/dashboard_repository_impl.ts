import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { DashboardRepository } from '@/src/client/domain/dashboard/repository/dashboard_repository';
import { DashboardRemoteDataSource } from '../data_source/dashboard_data_source';
import { DashboardRemoteDataSourceImpl } from '../data_source/dashboard_remote_data_source_impl';

export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(
    private readonly dataSource: DashboardRemoteDataSource = new DashboardRemoteDataSourceImpl()
  ) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.dataSource.getDashboardSummary();
  }
}
