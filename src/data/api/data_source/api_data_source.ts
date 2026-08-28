import { ApiCollection } from '@/src/domain/api/entity/api_collection';

export interface ApiDataSource {
  getApisByProjectId(projectId: string): Promise<ApiCollection[]>;
  getApiById(id: string): Promise<ApiCollection | null>;
  createApi(
    input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): Promise<ApiCollection>;
  updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection>;
  softDeleteApi(id: string): Promise<void>;
  removeApisByProjectId(projectId: string): Promise<void>;
}
