import { apiRequest } from '@/src/core/http-client/api-client';
import { Environment } from '@/src/domain/environment/entity/environment';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listEnvironments(): Promise<Environment[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment[]>>('/api/environments'));
}

export async function listEnvironmentsByProject(projectId: string): Promise<Environment[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment[]>>(`/api/projects/${encodeURIComponent(projectId)}/environments`));
}

export async function getEnvironment(id: string): Promise<Environment | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment | null>>(`/api/environments/${encodeURIComponent(id)}`));
}

export async function createEnvironmentRemote(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment>>('/api/environments', { method: 'POST', body: input }));
}

export async function updateEnvironmentRemote(id: string, input: Partial<Environment>): Promise<Environment> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment>>(`/api/environments/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteEnvironmentRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/environments/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
