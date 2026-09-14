import { apiRequest } from '@/src/core/http-client/api-client';
import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { ApiEnvironmentRemoteDataSource } from './api_environment_data_source';

export class ApiEnvironmentRemoteDataSourceImpl implements ApiEnvironmentRemoteDataSource {
  async getByApiId(apiId: string): Promise<ApiEnvironment[]> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ApiEnvironment[]>>(`/api/apis/${encodeURIComponent(apiId)}/environments`)
    );
  }

  async get(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ApiEnvironment | null>>(
        `/api/apis/${encodeURIComponent(apiId)}/environments/${encodeURIComponent(environmentId)}`
      )
    );
  }

  async upsert(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ApiEnvironment>>('/api/api-environments', { method: 'POST', body: input }));
  }
}

// Standalone functions for backward compatibility / tests
export const getApiEnvironment = (apiId: string, environmentId: string) => new ApiEnvironmentRemoteDataSourceImpl().get(apiId, environmentId);
export const upsertApiEnvironment = (input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => new ApiEnvironmentRemoteDataSourceImpl().upsert(input);
