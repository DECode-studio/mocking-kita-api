import { apiRequest } from '@/src/core/http-client/api-client';
import { Collection } from '@/src/domain/collection/entity/collection';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listCollectionsByProject(projectId: string): Promise<Collection[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection[]>>(`/api/projects/${encodeURIComponent(projectId)}/collections`));
}

export async function getCollection(id: string): Promise<Collection | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection | null>>(`/api/collections/${encodeURIComponent(id)}`));
}

export async function createCollectionRemote(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection>>('/api/collections', { method: 'POST', body: input }));
}

export async function updateCollectionRemote(id: string, input: Partial<Collection>): Promise<Collection> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection>>(`/api/collections/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteCollectionRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/collections/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
