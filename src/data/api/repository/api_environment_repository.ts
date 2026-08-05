import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { ApiEnvironmentRepository } from '@/src/domain/api/repository/api_environment_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class ApiEnvironmentRemoteRepository implements ApiEnvironmentRepository {
  async getByApiId(apiId: string): Promise<ApiEnvironment[]> {
    const database = await callDatabase<{ apiEnvironments: ApiEnvironment[] }>('getDatabase');
    return database.apiEnvironments.filter((apiEnv) => apiEnv.apiId === apiId);
  }

  async get(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    const database = await callDatabase<{ apiEnvironments: ApiEnvironment[] }>('getDatabase');
    return (
      database.apiEnvironments.find(
        (apiEnv) => apiEnv.apiId === apiId && apiEnv.environmentId === environmentId
      ) || null
    );
  }

  async upsert(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ApiEnvironment> {
    return callDatabase<ApiEnvironment>('upsertApiEnv', input);
  }
}
