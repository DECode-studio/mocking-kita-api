import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiCollectionRepository } from '@/src/domain/api/repository/api_repository';
import { createApiRemote, getApi, listApisByProject, softDeleteApiRemote, updateApiRemote } from '../api/api_collection_api_client';

export class ApiCollectionRemoteRepository implements ApiCollectionRepository {
  async getByProjectId(projectId: string): Promise<ApiCollection[]> {
    return listApisByProject(projectId);
  }

  async getById(id: string): Promise<ApiCollection | null> {
    return getApi(id);
  }

  async create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return createApiRemote(input);
  }

  async update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return updateApiRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteApiRemote(id);
  }
}
