import { Collection } from '@/src/domain/collection/entity/collection';
import { CollectionRepository } from '@/src/domain/collection/repository/collection_repository';
import { createCollectionRemote, getCollection, listCollectionsByProject, softDeleteCollectionRemote, updateCollectionRemote } from '../api/collection_api_client';

export class CollectionRemoteRepository implements CollectionRepository {
  async getByProjectId(projectId: string): Promise<Collection[]> {
    return listCollectionsByProject(projectId);
  }

  async getById(id: string): Promise<Collection | null> {
    return getCollection(id);
  }

  async create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return createCollectionRemote(input);
  }

  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    return updateCollectionRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteCollectionRemote(id);
  }
}
