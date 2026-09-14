import { Collection } from '../entity/collection';

export interface CollectionUseCase {
  getByProjectId(projectId: string): Promise<Collection[]>;
  create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection>;
  update(id: string, input: Partial<Collection>): Promise<Collection>;
  softDelete(id: string): Promise<void>;
}

