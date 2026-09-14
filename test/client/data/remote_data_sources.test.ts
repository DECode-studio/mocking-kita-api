import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/src/core/http-client/api-client';
import { getAllProjects, getProjectById, createProject } from '@/src/client/data/project/data_source/project_data_source_impl';
import { getApiEnvironment, upsertApiEnvironment } from '@/src/client/data/api/data_source/api_environment_data_source_impl';
import { createResponseScenario } from '@/src/client/data/response-scenario/data_source/response_scenario_data_source_impl';
import { AccountRemoteDataSourceImpl } from '@/src/client/data/account/data_source/account_remote_data_source_impl';

vi.mock('@/src/core/http-client/api-client', () => ({
  apiRequest: vi.fn(),
}));

describe('remote data sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('project datasource reads and mutates through REST API client', async () => {
    (apiRequest as any).mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'p1', name: 'One' },
        { id: 'p2', name: 'Two' },
      ],
    });

    await expect(getAllProjects()).resolves.toHaveLength(2);
    expect(apiRequest).toHaveBeenCalledWith('/api/projects');

    (apiRequest as any).mockResolvedValueOnce({ success: true, data: { id: 'p1', name: 'One' } });

    await expect(getProjectById('p1')).resolves.toMatchObject({ id: 'p1' });
    expect(apiRequest).toHaveBeenCalledWith('/api/projects/p1');

    const input = {
      id: 'p3',
      name: 'Three',
      status: true,
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    };
    (apiRequest as any).mockResolvedValueOnce({ success: true, data: input });

    await expect(createProject(input)).resolves.toMatchObject({ id: 'p3' });
    expect(apiRequest).toHaveBeenLastCalledWith('/api/projects', { method: 'POST', body: input });
  });

  it('api environment datasource is a remote wrapper', async () => {
    (apiRequest as any).mockResolvedValueOnce({ success: true, data: { id: 'ae1', apiId: 'api1', environmentId: 'env1', enabled: true } });

    await expect(getApiEnvironment('api1', 'env1')).resolves.toMatchObject({ id: 'ae1' });
    expect(apiRequest).toHaveBeenCalledWith('/api/apis/api1/environments/env1');

    const input = { apiId: 'api1', environmentId: 'env2', enabled: true };
    (apiRequest as any).mockResolvedValueOnce({ success: true, data: { id: 'ae3', ...input } });

    await expect(upsertApiEnvironment(input)).resolves.toMatchObject({ id: 'ae3' });
    expect(apiRequest).toHaveBeenLastCalledWith('/api/api-environments', { method: 'POST', body: input });
  });

  it('response scenario datasource mutates through REST API client', async () => {
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
    (apiRequest as any).mockResolvedValueOnce({ success: true, data: input });

    await expect(createResponseScenario(input)).resolves.toMatchObject({ id: 'res1' });
    expect(apiRequest).toHaveBeenCalledWith('/api/response-scenarios', { method: 'POST', body: input });
  });

  it('account datasource uses admin REST API client', async () => {
    const dataSource = new AccountRemoteDataSourceImpl();
    (apiRequest as any).mockResolvedValueOnce({
      success: true,
      accounts: [{ id: 'acc1', username: 'admin', name: 'Admin', role: 'ADMIN' }],
      ssoDomains: ['example.com'],
    });

    const result = await dataSource.getAll();
    expect(result.accounts).toHaveLength(1);
    expect(result.ssoDomains).toEqual(['example.com']);
    expect(apiRequest).toHaveBeenCalledWith('/api/admin/accounts');
  });
});
