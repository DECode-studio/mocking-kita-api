import { ApiCollection } from '../entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';

export interface ApiUseCase {
  load(projectId: string): Promise<{ project: Project | null; apis: ApiCollection[] }>;
  getAllApis(): Promise<ApiCollection[]>;
  create(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection>;
  update(id: string, input: Partial<ApiCollection>): Promise<ApiCollection>;
  softDelete(id: string): Promise<void>;
  toggleStatus(id: string): Promise<void>;
  duplicate(id: string): Promise<ApiCollection | null>;
}

