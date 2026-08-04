import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';

export interface ApiEnvironmentDataSource {
  getApiEnvironmentsByApiId(apiId: string): ApiEnvironment[];
  getApiEnvironment(apiId: string, environmentId: string): ApiEnvironment | null;
  upsertApiEnvironment(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): ApiEnvironment;
  removeApiEnvironmentsByApiId(apiId: string): void;
  removeApiEnvironmentsByEnvironmentId(environmentId: string): void;
}
