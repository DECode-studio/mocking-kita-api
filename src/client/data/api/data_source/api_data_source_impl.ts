import { apiRequest } from '@/src/core/http-client/api-client';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { ApiCollectionRemoteDataSource } from './api_data_source';

export class ApiCollectionRemoteDataSourceImpl implements ApiCollectionRemoteDataSource {
  async getAll(): Promise<ApiCollection[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection[]>>('/api/apis'));
  }

  async getByProjectId(projectId: string): Promise<ApiCollection[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection[]>>(`/api/projects/${encodeURIComponent(projectId)}/apis`));
  }

  async getById(id: string): Promise<ApiCollection | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection | null>>(`/api/apis/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection>>('/api/apis', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiCollection>>(`/api/apis/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/apis/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }
}
