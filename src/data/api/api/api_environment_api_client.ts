import { apiRequest } from '@/src/core/http-client/api-client';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listApiEnvironmentsByApi(apiId: string): Promise<ApiEnvironment[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiEnvironment[]>>(`/api/apis/${encodeURIComponent(apiId)}/environments`));
}

export async function getApiEnvironmentRemote(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
  return unwrapRemoteData(
    await apiRequest<RemoteEnvelope<ApiEnvironment | null>>(
      `/api/apis/${encodeURIComponent(apiId)}/environments/${encodeURIComponent(environmentId)}`
    )
  );
}

export async function upsertApiEnvironmentRemote(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiEnvironment>>('/api/api-environments', { method: 'POST', body: input }));
}
