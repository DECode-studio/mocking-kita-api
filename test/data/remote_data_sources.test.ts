import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { apiRequest } from '@/src/core/http-client/api-client';
import { getAllProjects, getProjectById, createProject } from '@/src/data/project/data_source/project_data_source_impl';
import { getApiEnvironment, upsertApiEnvironment } from '@/src/data/api/data_source/api_environment_data_source_impl';
import { createResponseScenario } from '@/src/data/response-scenario/data_source/response_scenario_data_source_impl';
import { AccountRepositoryImpl } from '@/src/data/account/repository/account_repository_impl';

vi.mock('@/src/core/http-client/database-proxy-client', () => ({
  callDatabase: vi.fn(),
}));

vi.mock('@/src/core/http-client/api-client', () => ({
  apiRequest: vi.fn(),
}));

describe('remote data sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('project datasource reads and mutates through database gateway', async () => {
    (callDatabase as any).mockResolvedValueOnce({
      projects: [
        { id: 'p1', name: 'One' },
        { id: 'p2', name: 'Two' },
      ],
    });

    await expect(getAllProjects()).resolves.toHaveLength(2);
    expect(callDatabase).toHaveBeenCalledWith('getDatabase');

    (callDatabase as any).mockResolvedValueOnce({
      projects: [{ id: 'p1', name: 'One' }],
    });

    await expect(getProjectById('p1')).resolves.toMatchObject({ id: 'p1' });

    const input = {
      id: 'p3',
      name: 'Three',
      status: true,
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    };
    (callDatabase as any).mockResolvedValueOnce(input);

    await expect(createProject(input)).resolves.toMatchObject({ id: 'p3' });
    expect(callDatabase).toHaveBeenLastCalledWith('create', input);
  });

  it('api environment datasource is a remote wrapper', async () => {
    (callDatabase as any).mockResolvedValueOnce({
      apiEnvironments: [
        { id: 'ae1', apiId: 'api1', environmentId: 'env1', enabled: true },
        { id: 'ae2', apiId: 'api2', environmentId: 'env1', enabled: false },
      ],
    });

    await expect(getApiEnvironment('api1', 'env1')).resolves.toMatchObject({ id: 'ae1' });

    const input = { apiId: 'api1', environmentId: 'env2', enabled: true };
    (callDatabase as any).mockResolvedValueOnce({ id: 'ae3', ...input });

    await expect(upsertApiEnvironment(input)).resolves.toMatchObject({ id: 'ae3' });
    expect(callDatabase).toHaveBeenLastCalledWith('upsertApiEnv', input);
  });

  it('response scenario datasource mutates through database gateway', async () => {
    const input = {
      id: 'res1',
      requestScenarioId: 'req1',
      name: 'OK',
      statusCode: 200,
      headers: {},
      body: {},
      responseType: 'JSON' as const,
      delayMs: 0,
      weight: 100,
      priority: 0,
      status: true,
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    };
    (callDatabase as any).mockResolvedValueOnce(input);

    await expect(createResponseScenario(input)).resolves.toMatchObject({ id: 'res1' });
    expect(callDatabase).toHaveBeenCalledWith('createRespScenario', input);
  });

  it('account repository uses admin API and keeps password hash server-only', async () => {
    const repository = new AccountRepositoryImpl();
    (apiRequest as any).mockResolvedValueOnce({
      success: true,
      accounts: [{ id: 'acc1', username: 'admin', name: 'Admin', role: 'ADMIN' }],
    });

    await expect(repository.getByUsername('ADMIN')).resolves.toMatchObject({ id: 'acc1' });
    expect(apiRequest).toHaveBeenCalledWith('/api/admin/accounts');
    await expect(repository.getPasswordHash('acc1')).rejects.toThrow('server-only');
  });
});
