import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { ApiEnvironmentRepository } from '@/src/domain/api/repository/api_environment_repository';
import { getApiEnvironmentRemote, listApiEnvironmentsByApi, upsertApiEnvironmentRemote } from '../api/api_environment_api_client';

export class ApiEnvironmentRemoteRepository implements ApiEnvironmentRepository {
  async getByApiId(apiId: string): Promise<ApiEnvironment[]> {
    return listApiEnvironmentsByApi(apiId);
  }

  async get(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    return getApiEnvironmentRemote(apiId, environmentId);
  }

  async upsert(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ApiEnvironment> {
    return upsertApiEnvironmentRemote(input);
  }
}
