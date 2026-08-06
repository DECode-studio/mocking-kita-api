import { Collection } from '@/src/domain/collection/entity/collection';
import { CollectionRepository } from '@/src/domain/collection/repository/collection_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class CollectionRemoteRepository implements CollectionRepository {
  async getByProjectId(projectId: string): Promise<Collection[]> {
    const database = await callDatabase<{ collections: Collection[] }>('getDatabase');
    return database.collections.filter((item) => item.projectId === projectId);
  }

  async getById(id: string): Promise<Collection | null> {
    const database = await callDatabase<{ collections: Collection[] }>('getDatabase');
    return database.collections.find((item) => item.id === id) || null;
  }

  async create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return callDatabase<Collection>('createCollection', input);
  }

  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    return callDatabase<Collection>('updateCollection', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteCollection', { id });
  }
}
