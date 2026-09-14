import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiCollectionRepositoryImpl } from '@/src/client/data/api/repository/api_collection_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ApiCollectionRepositoryImpl', () => {
  let repository: ApiCollectionRepositoryImpl;
  const mockApi = { id: 'api-1', projectId: 'p1', name: 'Get Users', path: '/users', methodRequest: 'GET', status: true };

  beforeEach(() => {
    repository = new ApiCollectionRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getByProjectId should filter apis by projectId', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockApi] });

    const result = await repository.getByProjectId('p1');

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/apis');
    expect(result).toEqual([mockApi]);
  });

  it('getById should return api by id or null', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: mockApi })
      .mockResolvedValueOnce({ success: true, data: null });

    const api = await repository.getById('api-1');
    expect(api).toEqual(mockApi);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1');

    const nullApi = await repository.getById('non-existent');
    expect(nullApi).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/non-existent');
  });

  it('create, update, and softDelete should call REST endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockApi });

    await repository.create(mockApi as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis', { method: 'POST', body: mockApi });

    await repository.update('api-1', { name: 'Updated' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1', { method: 'PUT', body: { name: 'Updated' } });

    await repository.softDelete('api-1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1', { method: 'DELETE' });
  });
});
