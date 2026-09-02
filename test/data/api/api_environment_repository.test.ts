import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiEnvironmentRemoteRepository } from '@/src/data/api/repository/api_environment_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('ApiEnvironmentRemoteRepository', () => {
  let repository: ApiEnvironmentRemoteRepository;
  const mockApiEnv = { id: 'apienv-1', apiId: 'api-1', environmentId: 'env-1', enabled: true };

  beforeEach(() => {
    repository = new ApiEnvironmentRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByApiId should filter apiEnvironments by apiId', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ apiEnvironments: [mockApiEnv] });

    const result = await repository.getByApiId('api-1');

    expect(dbClient.callDatabase).toHaveBeenCalledWith('getDatabase');
    expect(result).toEqual([mockApiEnv]);
  });

  it('get should return matching apiEnvironment or null', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ apiEnvironments: [mockApiEnv] });

    const result = await repository.get('api-1', 'env-1');
    expect(result).toEqual(mockApiEnv);

    const nullResult = await repository.get('api-1', 'invalid');
    expect(nullResult).toBeNull();
  });

  it('upsert should call callDatabase with procedure upsertApiEnv', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockApiEnv);

    await repository.upsert(mockApiEnv as any);

    expect(dbClient.callDatabase).toHaveBeenCalledWith('upsertApiEnv', mockApiEnv);
  });
});
