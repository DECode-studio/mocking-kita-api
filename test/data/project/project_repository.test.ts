import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('ProjectRemoteRepository', () => {
  let repository: ProjectRemoteRepository;
  const mockProject = { id: 'p1', name: 'Mock Studio', status: true };

  beforeEach(() => {
    repository = new ProjectRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getAll and getById should fetch database and return project', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ projects: [mockProject] });

    const list = await repository.getAll();
    expect(list).toEqual([mockProject]);

    const item = await repository.getById('p1');
    expect(item).toEqual(mockProject);
  });

  it('create, update, softDelete, restore, hardDelete, exportOpenApi, importOpenApi should call database proxy', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockProject);

    await repository.create(mockProject as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('create', mockProject);

    await repository.update('p1', { name: 'Updated' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('update', { id: 'p1', input: { name: 'Updated' } });

    await repository.softDelete('p1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDelete', { id: 'p1' });

    await repository.restore('p1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('restore', { id: 'p1' });

    await repository.hardDelete('p1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('hardDelete', { id: 'p1' });

    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ openapi: '3.0.0' });
    await repository.exportOpenApi('p1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('exportProjectOpenApi', { projectId: 'p1' });

    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ success: true, importedApiCount: 1, importedCollectionCount: 1 });
    await repository.importOpenApi('p1', {}, 'upsert');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('importProjectOpenApi', { projectId: 'p1', openApiJson: {}, mode: 'upsert' });
  });
});
