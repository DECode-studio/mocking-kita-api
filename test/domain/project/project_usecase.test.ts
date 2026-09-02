import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectUseCaseImpl } from '@/src/domain/project/usecase/project_usecase';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { Project } from '@/src/domain/project/entity/project';

describe('ProjectUseCaseImpl', () => {
  let repository: Partial<ProjectRepository>;
  let useCase: ProjectUseCaseImpl;

  const mockProject: Project = {
    id: 'p1',
    name: 'Main Project',
    description: 'A mock project',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      hardDelete: vi.fn(),
      exportOpenApi: vi.fn(),
      importOpenApi: vi.fn(),
    };
    useCase = new ProjectUseCaseImpl(repository as ProjectRepository);
  });

  it('should delegate getAll, getById, create, update, softDelete, restore, hardDelete', async () => {
    (repository.getAll as any).mockResolvedValue([mockProject]);
    (repository.getById as any).mockResolvedValue(mockProject);
    (repository.create as any).mockResolvedValue(mockProject);
    (repository.update as any).mockResolvedValue(mockProject);

    await useCase.getAll();
    expect(repository.getAll).toHaveBeenCalled();

    await useCase.getById('p1');
    expect(repository.getById).toHaveBeenCalledWith('p1');

    await useCase.create(mockProject);
    expect(repository.create).toHaveBeenCalledWith(mockProject);

    await useCase.update('p1', { name: 'Updated Name' });
    expect(repository.update).toHaveBeenCalledWith('p1', { name: 'Updated Name' });

    await useCase.softDelete('p1');
    expect(repository.softDelete).toHaveBeenCalledWith('p1');

    await useCase.restore('p1');
    expect(repository.restore).toHaveBeenCalledWith('p1');

    await useCase.hardDelete('p1');
    expect(repository.hardDelete).toHaveBeenCalledWith('p1');
  });

  it('should toggle project status when project exists', async () => {
    (repository.getById as any).mockResolvedValue(mockProject);

    await useCase.toggleStatus('p1');

    expect(repository.getById).toHaveBeenCalledWith('p1');
    expect(repository.update).toHaveBeenCalledWith('p1', { status: false });
  });

  it('should do nothing when toggling status of non-existent project', async () => {
    (repository.getById as any).mockResolvedValue(null);

    await useCase.toggleStatus('non-existent');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should duplicate project when project exists', async () => {
    (repository.getById as any).mockResolvedValue(mockProject);
    (repository.create as any).mockResolvedValue({ ...mockProject, id: 'p1-copy', name: 'Main Project (Copy)' });

    const result = await useCase.duplicate('p1');

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Main Project (Copy)',
      description: 'A mock project',
      status: true,
    });
    expect(result?.name).toBe('Main Project (Copy)');
  });

  it('should return null when duplicating non-existent project', async () => {
    (repository.getById as any).mockResolvedValue(null);

    const result = await useCase.duplicate('non-existent');

    expect(result).toBeNull();
  });

  it('should delegate exportOpenApi and importOpenApi to repository', async () => {
    const mockSpec = { openapi: '3.0.0' } as any;
    (repository.exportOpenApi as any).mockResolvedValue(mockSpec);
    (repository.importOpenApi as any).mockResolvedValue({ success: true, importedApiCount: 2, importedCollectionCount: 1 });

    const exportRes = await useCase.exportOpenApi('p1');
    expect(repository.exportOpenApi).toHaveBeenCalledWith('p1');
    expect(exportRes).toEqual(mockSpec);

    const importRes = await useCase.importOpenApi('p1', mockSpec, 'upsert');
    expect(repository.importOpenApi).toHaveBeenCalledWith('p1', mockSpec, 'upsert');
    expect(importRes.success).toBe(true);
  });
});
