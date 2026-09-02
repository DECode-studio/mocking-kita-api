import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiDetailUseCaseImpl } from '@/src/domain/api/usecase/api_detail_usecase';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { ApiCollectionRepository } from '@/src/domain/api/repository/api_repository';
import { EnvironmentRepository } from '@/src/domain/environment/repository/environment_repository';
import { ApiEnvironmentRepository } from '@/src/domain/api/repository/api_environment_repository';
import { RequestScenarioRepository } from '@/src/domain/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRepository } from '@/src/domain/response-scenario/repository/response_scenario_repository';

describe('ApiDetailUseCaseImpl', () => {
  let projectRepo: Partial<ProjectRepository>;
  let apiRepo: Partial<ApiCollectionRepository>;
  let envRepo: Partial<EnvironmentRepository>;
  let apiEnvRepo: Partial<ApiEnvironmentRepository>;
  let reqScenarioRepo: Partial<RequestScenarioRepository>;
  let respScenarioRepo: Partial<ResponseScenarioRepository>;
  let useCase: ApiDetailUseCaseImpl;

  const mockProject = { id: 'p1', name: 'Project 1' } as any;
  const mockApi = { id: 'a1', projectId: 'p1', name: 'API 1', path: '/users', status: true } as any;
  const mockEnvs = [
    { id: 'e1', projectId: 'p1', name: 'Dev' },
    { id: 'e2', projectId: 'p1', name: 'Deleted Env', deletedAt: new Date() },
  ] as any[];
  const mockApiEnvs = [{ id: 'ae1', apiId: 'a1', environmentId: 'e1', enabled: true }] as any[];
  const mockReqScenarios = [
    { id: 'r1', apiId: 'a1', name: 'Low Priority Req', priority: 1, status: true },
    { id: 'r2', apiId: 'a1', name: 'High Priority Req', priority: 10, status: true },
  ] as any[];
  const mockRespScenarios = [
    { id: 'res1', requestScenarioId: 'r2', name: '200 OK', priority: 10, weight: 100 },
  ] as any[];

  beforeEach(() => {
    projectRepo = { getById: vi.fn().mockResolvedValue(mockProject) };
    apiRepo = { getById: vi.fn().mockResolvedValue(mockApi), update: vi.fn().mockResolvedValue(mockApi) };
    envRepo = { getByProjectId: vi.fn().mockResolvedValue(mockEnvs) };
    apiEnvRepo = { getByApiId: vi.fn().mockResolvedValue(mockApiEnvs), upsert: vi.fn() };
    reqScenarioRepo = {
      getByApiId: vi.fn().mockResolvedValue(mockReqScenarios),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    respScenarioRepo = {
      getByRequestScenarioId: vi.fn().mockResolvedValue(mockRespScenarios),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      uploadFile: vi.fn(),
    };

    useCase = new ApiDetailUseCaseImpl(
      projectRepo as ProjectRepository,
      apiRepo as ApiCollectionRepository,
      envRepo as EnvironmentRepository,
      apiEnvRepo as ApiEnvironmentRepository,
      reqScenarioRepo as RequestScenarioRepository,
      respScenarioRepo as ResponseScenarioRepository
    );
  });

  it('should load snapshot, filter deleted items, and sort scenarios by priority desc', async () => {
    const snapshot = await useCase.load('p1', 'a1', 'r2');

    expect(snapshot.project).toEqual(mockProject);
    expect(snapshot.api).toEqual(mockApi);
    expect(snapshot.projectEnvs).toHaveLength(1); // Deleted env filtered out
    expect(snapshot.requestScenarios[0].id).toBe('r2'); // Higher priority first
    expect(snapshot.activeReqScenario?.id).toBe('r2');
  });

  it('should toggle API status', async () => {
    await useCase.toggleApiStatus('a1');

    expect(apiRepo.getById).toHaveBeenCalledWith('a1');
    expect(apiRepo.update).toHaveBeenCalledWith('a1', { status: false });
  });

  it('should create and update request scenarios', async () => {
    const input = { apiId: 'a1', name: 'New Req', priority: 5 } as any;
    (reqScenarioRepo.create as any).mockResolvedValue({ id: 'r3', ...input });

    const created = await useCase.createRequestScenario(input);
    expect(reqScenarioRepo.create).toHaveBeenCalledWith(input);
    expect(created.id).toBe('r3');

    await useCase.updateRequestScenario('r3', { name: 'Updated' });
    expect(reqScenarioRepo.update).toHaveBeenCalledWith('r3', { name: 'Updated' });
  });

  it('should duplicate request scenario', async () => {
    const target = { id: 'r1', apiId: 'a1', name: 'Base Req', priority: 1, status: true } as any;
    (reqScenarioRepo.getById as any).mockResolvedValue(target);

    await useCase.duplicateRequestScenario('r1');

    expect(reqScenarioRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Base Req (Copy)',
        status: false,
      })
    );
  });

  it('should duplicate response scenario', async () => {
    const target = {
      id: 'res1',
      requestScenarioId: 'r1',
      name: '200 OK',
      statusCode: 200,
      responseType: 'JSON',
      status: true,
    } as any;
    (respScenarioRepo.getById as any).mockResolvedValue(target);

    await useCase.duplicateResponseScenario('res1');

    expect(respScenarioRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '200 OK (Copy)',
        statusCode: 200,
      })
    );
  });
});
