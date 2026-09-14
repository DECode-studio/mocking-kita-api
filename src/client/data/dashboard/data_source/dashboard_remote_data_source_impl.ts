import { apiRequest } from '@/src/core/http-client/api-client';
import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { DashboardRemoteDataSource } from './dashboard_data_source';

export class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  async getDashboardSummary(): Promise<DashboardSummary> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<DashboardSummary>>('/api/dashboard/summary'));
  }
}
