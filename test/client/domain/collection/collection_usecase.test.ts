import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionUseCaseImpl } from '@/src/client/domain/collection/usecase/collection_usecase_impl';
import { CollectionRepository } from '@/src/client/domain/collection/repository/collection_repository';
import { Collection } from '@/src/client/domain/collection/entity/collection';

describe('CollectionUseCaseImpl', () => {
  let repository: Partial<CollectionRepository>;
  let useCase: CollectionUseCaseImpl;

  const activeCollection: Collection = {
    id: 'col-1',
    projectId: 'proj-1',
    name: 'Auth APIs',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const deletedCollection: Collection = {
    id: 'col-2',
    projectId: 'proj-1',
    name: 'Old APIs',
    status: false,
    deletedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      getByProjectId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new CollectionUseCaseImpl(repository as CollectionRepository);
  });

  it('should filter out deleted collections in getByProjectId', async () => {
    (repository.getByProjectId as any).mockResolvedValue([activeCollection, deletedCollection]);

    const result = await useCase.getByProjectId('proj-1');

    expect(repository.getByProjectId).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([activeCollection]);
  });

  it('should delegate create, update, and softDelete to repository', async () => {
    (repository.create as any).mockResolvedValue(activeCollection);
    (repository.update as any).mockResolvedValue(activeCollection);
    (repository.softDelete as any).mockResolvedValue(undefined);

    await useCase.create(activeCollection);
    expect(repository.create).toHaveBeenCalledWith(activeCollection);

    await useCase.update('col-1', { name: 'Updated Auth' });
    expect(repository.update).toHaveBeenCalledWith('col-1', { name: 'Updated Auth' });

    await useCase.softDelete('col-1');
    expect(repository.softDelete).toHaveBeenCalledWith('col-1');
  });
});
