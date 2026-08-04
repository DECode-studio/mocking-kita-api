import { ApiCollection } from '@/src/domain/api/entity/api_collection';

export interface ApiDataSource {
  getApisByProjectId(projectId: string): ApiCollection[];
  getApiById(id: string): ApiCollection | null;
  createApi(
    input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): ApiCollection;
  updateApi(id: string, input: Partial<ApiCollection>): ApiCollection;
  softDeleteApi(id: string): void;
  removeApisByProjectId(projectId: string): void;
}
