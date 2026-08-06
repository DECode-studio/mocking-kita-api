import { Collection } from '../entity/collection';
import { CollectionRepository } from '../repository/collection_repository';

export interface CollectionUseCase {
  getByProjectId(projectId: string): Promise<Collection[]>;
  create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection>;
  update(id: string, input: Partial<Collection>): Promise<Collection>;
  softDelete(id: string): Promise<void>;
}

export class CollectionUseCaseImpl implements CollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async getByProjectId(projectId: string): Promise<Collection[]> {
    const list = await this.collectionRepository.getByProjectId(projectId);
    return list.filter((item) => !item.deletedAt);
  }

  create(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return this.collectionRepository.create(input);
  }

  update(id: string, input: Partial<Collection>): Promise<Collection> {
    return this.collectionRepository.update(id, input);
  }

  softDelete(id: string): Promise<void> {
    return this.collectionRepository.softDelete(id);
  }
}
