import { apiRequest } from '@/src/core/http-client/api-client';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listApis(): Promise<ApiCollection[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection[]>>('/api/apis'));
}

export async function listApisByProject(projectId: string): Promise<ApiCollection[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection[]>>(`/api/projects/${encodeURIComponent(projectId)}/apis`));
}

export async function getApi(id: string): Promise<ApiCollection | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection | null>>(`/api/apis/${encodeURIComponent(id)}`));
}

export async function createApiRemote(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection>>('/api/apis', { method: 'POST', body: input }));
}

export async function updateApiRemote(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection>>(`/api/apis/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteApiRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/apis/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
