import { Environment } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentRepository } from '@/src/client/domain/environment/repository/environment_repository';
import { EnvironmentRemoteDataSource } from '../data_source/environment_data_source';
import { EnvironmentRemoteDataSourceImpl } from '../data_source/environment_data_source_impl';

export class EnvironmentRepositoryImpl implements EnvironmentRepository {
  constructor(private dataSource: EnvironmentRemoteDataSource = new EnvironmentRemoteDataSourceImpl()) {}

  async getAll(): Promise<Environment[]> {
    return this.dataSource.getAll();
  }

  async getByProjectId(projectId: string): Promise<Environment[]> {
    return this.dataSource.getByProjectId(projectId);
  }

  async getById(id: string): Promise<Environment | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<Environment>): Promise<Environment> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }
}
