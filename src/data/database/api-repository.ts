import { ApiCollection } from '@/src/domain/api/entity/api_collection';

export interface ApiDatabaseRepository {
  createApi(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection>;
  updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection>;
  softDeleteApi(id: string): Promise<void>;
  getByProjectIdApi(projectId: string): Promise<ApiCollection[]>;
  getApiById(id: string): Promise<ApiCollection | null>;
}
