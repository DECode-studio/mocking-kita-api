import { Collection } from '@/src/client/domain/collection/entity/collection';
import { CollectionRepository } from '@/src/client/domain/collection/repository/collection_repository';
import { CollectionRemoteDataSource } from '../data_source/collection_data_source';
import { CollectionRemoteDataSourceImpl } from '../data_source/collection_data_source_impl';

export class CollectionRepositoryImpl implements CollectionRepository {
  constructor(private dataSource: CollectionRemoteDataSource = new CollectionRemoteDataSourceImpl()) {}

  async getByProjectId(projectId: string): Promise<Collection[]> {
    return this.dataSource.getByProjectId(projectId);
  }

  async getById(id: string): Promise<Collection | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }
}
