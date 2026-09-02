import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('EnvironmentRemoteRepository', () => {
  let repository: EnvironmentRemoteRepository;
  const mockEnv = { id: 'env-1', projectId: 'p1', name: 'Dev', environmentType: 'DEVELOPMENT', status: true };

  beforeEach(() => {
    repository = new EnvironmentRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByProjectId and getById should call getDatabase and filter', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ environments: [mockEnv] });

    const list = await repository.getByProjectId('p1');
    expect(list).toEqual([mockEnv]);

    const item = await repository.getById('env-1');
    expect(item).toEqual(mockEnv);

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
  });

  it('create, update, and softDelete should call callDatabase procedure', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockEnv);

    await repository.create(mockEnv as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('createEnvironment', mockEnv);

    await repository.update('env-1', { name: 'Staging' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('updateEnvironment', { id: 'env-1', input: { name: 'Staging' } });

    await repository.softDelete('env-1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDeleteEnvironment', { id: 'env-1' });
  });
});
