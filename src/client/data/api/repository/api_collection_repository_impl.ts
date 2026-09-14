import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { ApiCollectionRepository } from '@/src/client/domain/api/repository/api_repository';
import { ApiCollectionRemoteDataSource } from '../data_source/api_data_source';
import { ApiCollectionRemoteDataSourceImpl } from '../data_source/api_data_source_impl';

export class ApiCollectionRepositoryImpl implements ApiCollectionRepository {
  constructor(private dataSource: ApiCollectionRemoteDataSource = new ApiCollectionRemoteDataSourceImpl()) {}

  async getAll(): Promise<ApiCollection[]> {
    return this.dataSource.getAll();
  }

  async getByProjectId(projectId: string): Promise<ApiCollection[]> {
    return this.dataSource.getByProjectId(projectId);
  }

  async getById(id: string): Promise<ApiCollection | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }
}
