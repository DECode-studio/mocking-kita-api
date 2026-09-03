import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionRemoteRepository } from '@/src/data/collection/repository/collection_repository';
import * as apiClient from '@/src/core/http-client/api-client';

describe('CollectionRemoteRepository', () => {
  let repository: CollectionRemoteRepository;
  const mockCol = { id: 'col-1', projectId: 'p1', name: 'Auth', status: true };

  beforeEach(() => {
    repository = new CollectionRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByProjectId and getById should request only collection data needed', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: [mockCol] })
      .mockResolvedValueOnce({ success: true, data: mockCol })
      .mockResolvedValueOnce({ success: true, data: null });

    const list = await repository.getByProjectId('p1');
    expect(list).toEqual([mockCol]);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/collections');

    const item = await repository.getById('col-1');
    expect(item).toEqual(mockCol);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/collections/col-1');

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/collections/invalid');
  });

  it('create, update, and softDelete should call REST endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockCol });

    await repository.create(mockCol as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/collections', { method: 'POST', body: mockCol });

    await repository.update('col-1', { name: 'Updated Auth' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/collections/col-1', { method: 'PUT', body: { name: 'Updated Auth' } });

    await repository.softDelete('col-1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/collections/col-1', { method: 'DELETE' });
  });
});
