import { apiRequest } from '@/src/core/http-client/api-client';
import { Collection } from '@/src/client/domain/collection/entity/collection';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { CollectionRemoteDataSource } from './collection_data_source';

export class CollectionRemoteDataSourceImpl implements CollectionRemoteDataSource {
  async getByProjectId(projectId: string): Promise<Collection[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection[]>>(`/api/projects/${encodeURIComponent(projectId)}/collections`));
  }

  async getById(id: string): Promise<Collection | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection | null>>(`/api/collections/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection>>('/api/collections', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Collection>>(`/api/collections/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/collections/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }
}

// Standalone functions for backward compatibility / tests if needed
export const listCollectionsByProject = (projectId: string) => new CollectionRemoteDataSourceImpl().getByProjectId(projectId);
export const getCollection = (id: string) => new CollectionRemoteDataSourceImpl().getById(id);
export const createCollectionRemote = (input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => new CollectionRemoteDataSourceImpl().create(input);
export const updateCollectionRemote = (id: string, input: Partial<Collection>) => new CollectionRemoteDataSourceImpl().update(id, input);
export const softDeleteCollectionRemote = (id: string) => new CollectionRemoteDataSourceImpl().softDelete(id);
