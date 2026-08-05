import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiCollectionRepository } from '@/src/domain/api/repository/api_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class ApiCollectionRemoteRepository implements ApiCollectionRepository {
  async getByProjectId(projectId: string): Promise<ApiCollection[]> {
    const database = await callDatabase<{ apiCollections: ApiCollection[] }>('getDatabase');
    return database.apiCollections.filter((api) => api.projectId === projectId);
  }

  async getById(id: string): Promise<ApiCollection | null> {
    const database = await callDatabase<{ apiCollections: ApiCollection[] }>('getDatabase');
    return database.apiCollections.find((api) => api.id === id) || null;
  }

  async create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return callDatabase<ApiCollection>('createApi', input);
  }

  async update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return callDatabase<ApiCollection>('updateApi', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteApi', { id });
  }
}
