import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import * as apiClient from '@/src/core/http-client/api-client';

describe('EnvironmentRemoteRepository', () => {
  let repository: EnvironmentRemoteRepository;
  const mockEnv = { id: 'env-1', projectId: 'p1', name: 'Dev', environmentType: 'DEVELOPMENT', status: true };

  beforeEach(() => {
    repository = new EnvironmentRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByProjectId and getById should request only environment data needed', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: [mockEnv] })
      .mockResolvedValueOnce({ success: true, data: mockEnv })
      .mockResolvedValueOnce({ success: true, data: null });

    const list = await repository.getByProjectId('p1');
    expect(list).toEqual([mockEnv]);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/environments');

    const item = await repository.getById('env-1');
    expect(item).toEqual(mockEnv);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/environments/env-1');

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/environments/invalid');
  });

  it('create, update, and softDelete should call REST endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockEnv });

    await repository.create(mockEnv as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/environments', { method: 'POST', body: mockEnv });

    await repository.update('env-1', { name: 'Staging' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/environments/env-1', { method: 'PUT', body: { name: 'Staging' } });

    await repository.softDelete('env-1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/environments/env-1', { method: 'DELETE' });
  });
});
