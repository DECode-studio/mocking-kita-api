import { apiRequest } from '@/src/core/http-client/api-client';
import { DashboardSummary } from '@/src/domain/dashboard/entity/dashboard_summary';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function getDashboardSummaryRemote(): Promise<DashboardSummary> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<DashboardSummary>>('/api/dashboard/summary'));
}
