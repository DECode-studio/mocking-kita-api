import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionRemoteRepository } from '@/src/data/collection/repository/collection_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('CollectionRemoteRepository', () => {
  let repository: CollectionRemoteRepository;
  const mockCol = { id: 'col-1', projectId: 'p1', name: 'Auth', status: true };

  beforeEach(() => {
    repository = new CollectionRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByProjectId and getById should call getDatabase and filter', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ collections: [mockCol] });

    const list = await repository.getByProjectId('p1');
    expect(list).toEqual([mockCol]);

    const item = await repository.getById('col-1');
    expect(item).toEqual(mockCol);

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
  });

  it('create, update, and softDelete should call callDatabase procedures', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockCol);

    await repository.create(mockCol as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('createCollection', mockCol);

    await repository.update('col-1', { name: 'Updated Auth' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('updateCollection', { id: 'col-1', input: { name: 'Updated Auth' } });

    await repository.softDelete('col-1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDeleteCollection', { id: 'col-1' });
  });
});
