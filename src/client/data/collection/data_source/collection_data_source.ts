import { Collection } from '@/src/client/domain/collection/entity/collection';

export interface CollectionRemoteDataSource {
  getByProjectId(projectId: string): Promise<Collection[]>;
  getById(id: string): Promise<Collection | null>;
  create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection>;
  update(id: string, input: Partial<Collection>): Promise<Collection>;
  softDelete(id: string): Promise<void>;
}
