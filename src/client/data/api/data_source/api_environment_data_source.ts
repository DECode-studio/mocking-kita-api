import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';

export interface ApiEnvironmentRemoteDataSource {
  getByApiId(apiId: string): Promise<ApiEnvironment[]>;
  get(apiId: string, environmentId: string): Promise<ApiEnvironment | null>;
  upsert(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment>;
}
