import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';

export interface ApiEnvironmentDatabaseRepository {
  upsertApiEnv(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment>;
  getByApiIdApiEnv(apiId: string): Promise<ApiEnvironment[]>;
  getApiEnv(apiId: string, environmentId: string): Promise<ApiEnvironment | null>;
}
