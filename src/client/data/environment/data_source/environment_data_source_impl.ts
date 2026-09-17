import { apiRequest } from '@/src/core/http-client/api-client';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { EnvironmentRemoteDataSource } from './environment_data_source';

export class EnvironmentRemoteDataSourceImpl implements EnvironmentRemoteDataSource {
  async getAll(): Promise<Environment[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment[]>>('/api/environments'));
  }

  async getByProjectId(projectId: string): Promise<Environment[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment[]>>(`/api/projects/${encodeURIComponent(projectId)}/environments`));
  }

  async getById(id: string): Promise<Environment | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment | null>>(`/api/environments/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment>>('/api/environments', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<Environment>): Promise<Environment> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<Environment>>(`/api/environments/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/environments/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }
}

// Standalone functions for backward compatibility / tests if needed
export const listEnvironmentsByProject = (projectId: string) => new EnvironmentRemoteDataSourceImpl().getByProjectId(projectId);
export const getEnvironment = (id: string) => new EnvironmentRemoteDataSourceImpl().getById(id);
export const createEnvironmentRemote = (input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => new EnvironmentRemoteDataSourceImpl().create(input);
export const updateEnvironmentRemote = (id: string, input: Partial<Environment>) => new EnvironmentRemoteDataSourceImpl().update(id, input);
export const softDeleteEnvironmentRemote = (id: string) => new EnvironmentRemoteDataSourceImpl().softDelete(id);
