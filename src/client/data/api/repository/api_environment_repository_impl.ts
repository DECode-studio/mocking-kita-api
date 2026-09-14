import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { ApiEnvironmentRepository } from '@/src/client/domain/api/repository/api_environment_repository';
import { ApiEnvironmentRemoteDataSource } from '../data_source/api_environment_data_source';
import { ApiEnvironmentRemoteDataSourceImpl } from '../data_source/api_environment_data_source_impl';

export class ApiEnvironmentRepositoryImpl implements ApiEnvironmentRepository {
  constructor(private dataSource: ApiEnvironmentRemoteDataSource = new ApiEnvironmentRemoteDataSourceImpl()) {}

  async getByApiId(apiId: string): Promise<ApiEnvironment[]> {
    return this.dataSource.getByApiId(apiId);
  }

  async get(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    return this.dataSource.get(apiId, environmentId);
  }

  async upsert(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment> {
    return this.dataSource.upsert(input);
  }
}
