import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectRepositoryImpl } from '@/src/client/data/project/repository/project_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ProjectRepositoryImpl', () => {
  let repository: ProjectRepositoryImpl;
  const mockProject = { id: 'p1', name: 'Mock Studio', status: true };

  beforeEach(() => {
    repository = new ProjectRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getAll and getById should fetch only the requested project data', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: [mockProject] })
      .mockResolvedValueOnce({ success: true, data: mockProject });

    const list = await repository.getAll();
    expect(list).toEqual([mockProject]);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects');

    const item = await repository.getById('p1');
    expect(item).toEqual(mockProject);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1');
  });

  it('create, update, softDelete, restore, hardDelete, exportOpenApi, importOpenApi should call database proxy', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockProject });

    await repository.create(mockProject as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects', { method: 'POST', body: mockProject });

    await repository.update('p1', { name: 'Updated' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1', { method: 'PUT', body: { name: 'Updated' } });

    await repository.softDelete('p1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1', { method: 'DELETE' });

    await repository.restore('p1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/restore', { method: 'POST' });

    await repository.hardDelete('p1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/hard', { method: 'DELETE' });

    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ openapi: '3.0.0' });
    await repository.exportOpenApi('p1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/export-openapi');

    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: { importedApiCount: 1, importedCollectionCount: 1 } });
    await repository.importOpenApi('p1', {}, 'upsert');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/projects/p1/import-openapi', { method: 'POST', body: { openApiJson: {}, mode: 'upsert' } });
  });
});
