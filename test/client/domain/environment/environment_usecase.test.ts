import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentUseCaseImpl } from '@/src/client/domain/environment/usecase/environment_usecase_impl';
import { EnvironmentRepository } from '@/src/client/domain/environment/repository/environment_repository';
import { ProjectRepository } from '@/src/client/domain/project/repository/project_repository';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';

describe('EnvironmentUseCaseImpl', () => {
  let envRepository: Partial<EnvironmentRepository>;
  let projectRepository: Partial<ProjectRepository>;
  let useCase: EnvironmentUseCaseImpl;

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const activeEnv: Environment = {
    id: 'env-1',
    projectId: 'proj-1',
    name: 'Development',
    environmentType: 'DEVELOPMENT',
    baseUrl: 'http://localhost:3000',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const deletedEnv: Environment = {
    id: 'env-2',
    projectId: 'proj-1',
    name: 'Old Env',
    environmentType: 'LOCAL',
    baseUrl: 'http://localhost:3001',
    status: false,
    deletedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    envRepository = {
      getByProjectId: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    projectRepository = {
      getById: vi.fn(),
    };
    useCase = new EnvironmentUseCaseImpl(
      envRepository as EnvironmentRepository,
      projectRepository as ProjectRepository
    );
  });

  it('should load project and filter out deleted environments', async () => {
    (projectRepository.getById as any).mockResolvedValue(mockProject);
    (envRepository.getByProjectId as any).mockResolvedValue([activeEnv, deletedEnv]);

    const result = await useCase.load('proj-1');

    expect(projectRepository.getById).toHaveBeenCalledWith('proj-1');
    expect(envRepository.getByProjectId).toHaveBeenCalledWith('proj-1');
    expect(result.project).toEqual(mockProject);
    expect(result.environments).toEqual([activeEnv]);
  });

  it('should delegate create, update, and softDelete to repository', async () => {
    (envRepository.create as any).mockResolvedValue(activeEnv);
    (envRepository.update as any).mockResolvedValue(activeEnv);
    (envRepository.softDelete as any).mockResolvedValue(undefined);

    await useCase.create(activeEnv);
    expect(envRepository.create).toHaveBeenCalledWith(activeEnv);

    await useCase.update('env-1', { name: 'Dev 2' });
    expect(envRepository.update).toHaveBeenCalledWith('env-1', { name: 'Dev 2' });

    await useCase.softDelete('env-1');
    expect(envRepository.softDelete).toHaveBeenCalledWith('env-1');
  });

  it('should toggle environment status when environment exists', async () => {
    (envRepository.getById as any).mockResolvedValue(activeEnv);

    await useCase.toggleStatus('env-1');

    expect(envRepository.getById).toHaveBeenCalledWith('env-1');
    expect(envRepository.update).toHaveBeenCalledWith('env-1', { status: false });
  });

  it('should do nothing when toggling status of non-existent environment', async () => {
    (envRepository.getById as any).mockResolvedValue(null);

    await useCase.toggleStatus('non-existent');

    expect(envRepository.update).not.toHaveBeenCalled();
  });
});
