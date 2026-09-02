import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiCollectionRemoteRepository } from '@/src/data/api/repository/api_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('ApiCollectionRemoteRepository', () => {
  let repository: ApiCollectionRemoteRepository;
  const mockApi = { id: 'api-1', projectId: 'p1', name: 'Get Users', path: '/users', methodRequest: 'GET', status: true };

  beforeEach(() => {
    repository = new ApiCollectionRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByProjectId should filter apis by projectId', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ apiCollections: [mockApi] });

    const result = await repository.getByProjectId('p1');

    expect(dbClient.callDatabase).toHaveBeenCalledWith('getDatabase');
    expect(result).toEqual([mockApi]);
  });

  it('getById should return api by id or null', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ apiCollections: [mockApi] });

    const api = await repository.getById('api-1');
    expect(api).toEqual(mockApi);

    const nullApi = await repository.getById('non-existent');
    expect(nullApi).toBeNull();
  });

  it('create, update, and softDelete should call callDatabase with procedure name', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockApi);

    await repository.create(mockApi as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('createApi', mockApi);

    await repository.update('api-1', { name: 'Updated' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('updateApi', { id: 'api-1', input: { name: 'Updated' } });

    await repository.softDelete('api-1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDeleteApi', { id: 'api-1' });
  });
});
