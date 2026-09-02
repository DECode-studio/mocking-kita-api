import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiUseCaseImpl } from '@/src/domain/api/usecase/api_usecase';
import { ApiCollectionRepository } from '@/src/domain/api/repository/api_repository';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Project } from '@/src/domain/project/entity/project';

describe('ApiUseCaseImpl', () => {
  let apiRepository: Partial<ApiCollectionRepository>;
  let projectRepository: Partial<ProjectRepository>;
  let useCase: ApiUseCaseImpl;

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Mock Project',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const activeApi: ApiCollection = {
    id: 'api-1',
    projectId: 'proj-1',
    name: 'Get Users',
    path: '/users',
    methodRequest: 'GET',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const deletedApi: ApiCollection = {
    id: 'api-2',
    projectId: 'proj-1',
    name: 'Deleted Endpoint',
    path: '/deleted',
    methodRequest: 'DELETE',
    status: false,
    deletedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    apiRepository = {
      getByProjectId: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    projectRepository = {
      getById: vi.fn(),
    };
    useCase = new ApiUseCaseImpl(
      apiRepository as ApiCollectionRepository,
      projectRepository as ProjectRepository
    );
  });

  it('should load project and filter out deleted APIs', async () => {
    (projectRepository.getById as any).mockResolvedValue(mockProject);
    (apiRepository.getByProjectId as any).mockResolvedValue([activeApi, deletedApi]);

    const result = await useCase.load('proj-1');

    expect(projectRepository.getById).toHaveBeenCalledWith('proj-1');
    expect(apiRepository.getByProjectId).toHaveBeenCalledWith('proj-1');
    expect(result.project).toEqual(mockProject);
    expect(result.apis).toEqual([activeApi]);
  });

  it('should delegate create, update, and softDelete to repository', async () => {
    (apiRepository.create as any).mockResolvedValue(activeApi);
    (apiRepository.update as any).mockResolvedValue(activeApi);
    (apiRepository.softDelete as any).mockResolvedValue(undefined);

    await useCase.create(activeApi);
    expect(apiRepository.create).toHaveBeenCalledWith(activeApi);

    await useCase.update('api-1', { name: 'Updated Users' });
    expect(apiRepository.update).toHaveBeenCalledWith('api-1', { name: 'Updated Users' });

    await useCase.softDelete('api-1');
    expect(apiRepository.softDelete).toHaveBeenCalledWith('api-1');
  });

  it('should toggle API status when API exists', async () => {
    (apiRepository.getById as any).mockResolvedValue(activeApi);

    await useCase.toggleStatus('api-1');

    expect(apiRepository.getById).toHaveBeenCalledWith('api-1');
    expect(apiRepository.update).toHaveBeenCalledWith('api-1', { status: false });
  });

  it('should do nothing when toggling status of non-existent API', async () => {
    (apiRepository.getById as any).mockResolvedValue(null);

    await useCase.toggleStatus('non-existent');

    expect(apiRepository.update).not.toHaveBeenCalled();
  });

  it('should duplicate API when API exists', async () => {
    (apiRepository.getById as any).mockResolvedValue(activeApi);
    (apiRepository.create as any).mockResolvedValue({
      ...activeApi,
      id: 'api-copy',
      name: 'Get Users (Copy)',
      path: '/users-copy',
    });

    const result = await useCase.duplicate('api-1');

    expect(apiRepository.create).toHaveBeenCalledWith({
      projectId: 'proj-1',
      name: 'Get Users (Copy)',
      description: undefined,
      path: '/users-copy',
      methodRequest: 'GET',
      status: true,
    });
    expect(result?.name).toBe('Get Users (Copy)');
  });

  it('should return null when duplicating non-existent API', async () => {
    (apiRepository.getById as any).mockResolvedValue(null);

    const result = await useCase.duplicate('non-existent');

    expect(result).toBeNull();
  });
});
