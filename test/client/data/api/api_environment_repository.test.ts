import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiEnvironmentRepositoryImpl } from '@/src/client/data/api/repository/api_environment_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ApiEnvironmentRepositoryImpl', () => {
  let repository: ApiEnvironmentRepositoryImpl;
  const mockApiEnv = { id: 'apienv-1', apiId: 'api-1', environmentId: 'env-1', enabled: true };

  beforeEach(() => {
    repository = new ApiEnvironmentRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getByApiId should filter apiEnvironments by apiId', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockApiEnv] });

    const result = await repository.getByApiId('api-1');

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1/environments');
    expect(result).toEqual([mockApiEnv]);
  });

  it('get should return matching apiEnvironment or null', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: mockApiEnv })
      .mockResolvedValueOnce({ success: true, data: null });

    const result = await repository.get('api-1', 'env-1');
    expect(result).toEqual(mockApiEnv);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1/environments/env-1');

    const nullResult = await repository.get('api-1', 'invalid');
    expect(nullResult).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1/environments/invalid');
  });

  it('upsert should call REST endpoint', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockApiEnv });

    await repository.upsert(mockApiEnv as any);

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/api-environments', { method: 'POST', body: mockApiEnv });
  });
});
