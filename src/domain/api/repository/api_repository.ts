import { ApiCollection } from '../entity/api_collection';

export interface ApiCollectionRepository {
  getByProjectId(projectId: string): Promise<ApiCollection[]>;
  getById(id: string): Promise<ApiCollection | null>;
  create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection>;
  update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection>;
  softDelete(id: string): Promise<void>;
}
