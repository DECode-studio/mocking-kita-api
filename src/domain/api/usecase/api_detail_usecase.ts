import { ApiCollection } from '../entity/api_collection';
import { ApiEnvironment } from '../entity/api_environment';
import { ApiCollectionRepository } from '../repository/api_repository';
import { ApiEnvironmentRepository } from '../repository/api_environment_repository';
import { EnvironmentRepository } from '@/src/domain/environment/repository/environment_repository';
import { ProjectRepository } from '@/src/domain/project/repository/project_repository';
import { RequestScenarioRepository } from '@/src/domain/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRepository } from '@/src/domain/response-scenario/repository/response_scenario_repository';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

export interface ApiDetailSnapshot {
  project: Project | null;
  api: ApiCollection | null;
  projectEnvs: Environment[];
  apiEnvironments: ApiEnvironment[];
  requestScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
  activeResponseScenarios: ResponseScenario[];
  activeReqScenario: RequestScenario | null;
}

type CreateRequestScenarioInput = Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>;
type CreateResponseScenarioInput = Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>;

export interface ApiDetailUseCase {
  load(projectId: string, apiId: string, selectedReqScenarioId?: string | null): Promise<ApiDetailSnapshot>;
  toggleApiStatus(apiId: string): Promise<void>;
  createRequestScenario(input: CreateRequestScenarioInput): Promise<RequestScenario>;
  updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario>;
  createResponseScenario(input: CreateResponseScenarioInput): Promise<ResponseScenario>;
  updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario>;
  upsertApiEnvironment(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment>;
  toggleRequestScenarioStatus(id: string): Promise<void>;
  duplicateRequestScenario(id: string): Promise<RequestScenario | null>;
  deleteRequestScenario(id: string): Promise<void>;
  toggleResponseScenarioStatus(id: string): Promise<void>;
  duplicateResponseScenario(id: string): Promise<ResponseScenario | null>;
  deleteResponseScenario(id: string): Promise<void>;
  uploadResponseFile(file: File): Promise<{ filePath: string; fileName: string }>;
}

export class ApiDetailUseCaseImpl implements ApiDetailUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly apiRepository: ApiCollectionRepository,
    private readonly environmentRepository: EnvironmentRepository,
    private readonly apiEnvironmentRepository: ApiEnvironmentRepository,
    private readonly requestScenarioRepository: RequestScenarioRepository,
    private readonly responseScenarioRepository: ResponseScenarioRepository
  ) {}

  async load(projectId: string, apiId: string, selectedReqScenarioId?: string | null): Promise<ApiDetailSnapshot> {
    const [project, api, projectEnvs, apiEnvironments, requestScenarios] = await Promise.all([
      this.projectRepository.getById(projectId),
      this.apiRepository.getById(apiId),
      this.environmentRepository.getByProjectId(projectId),
      this.apiEnvironmentRepository.getByApiId(apiId),
      this.requestScenarioRepository.getByApiId(apiId),
    ]);

    const sortedProjectEnvs = projectEnvs.filter((environment) => !environment.deletedAt);
    const sortedRequestScenarios = requestScenarios
      .filter((scenario) => !scenario.deletedAt)
      .sort((a, b) => b.priority - a.priority);
    const activeReqScenario =
      sortedRequestScenarios.find((scenario) => scenario.id === selectedReqScenarioId) ||
      sortedRequestScenarios[0] ||
      null;

    const activeResponseScenarios = activeReqScenario
      ? (await this.responseScenarioRepository.getByRequestScenarioId(activeReqScenario.id))
          .filter((scenario) => !scenario.deletedAt)
          .sort((a, b) => b.priority - a.priority || b.weight - a.weight)
      : [];

    const responseScenarios = requestScenarios.length
      ? (
          await Promise.all(
            sortedRequestScenarios.map((scenario) =>
              this.responseScenarioRepository.getByRequestScenarioId(scenario.id).then((items) =>
                items.filter((item) => !item.deletedAt)
              )
            )
          )
        )
          .flat()
          .sort((a, b) => b.priority - a.priority || b.weight - a.weight)
      : [];

    return {
      project,
      api,
      projectEnvs: sortedProjectEnvs,
      apiEnvironments,
      requestScenarios: sortedRequestScenarios,
      responseScenarios,
      activeResponseScenarios,
      activeReqScenario,
    };
  }

  async toggleApiStatus(apiId: string): Promise<void> {
    const api = await this.apiRepository.getById(apiId);
    if (!api) return;
    await this.apiRepository.update(apiId, { status: !api.status });
  }

  createRequestScenario(input: CreateRequestScenarioInput): Promise<RequestScenario> {
    return this.requestScenarioRepository.create(input);
  }

  updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return this.requestScenarioRepository.update(id, input);
  }

  createResponseScenario(input: CreateResponseScenarioInput): Promise<ResponseScenario> {
    return this.responseScenarioRepository.create(input);
  }

  updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return this.responseScenarioRepository.update(id, input);
  }

  upsertApiEnvironment(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ApiEnvironment> {
    return this.apiEnvironmentRepository.upsert(input);
  }

  async toggleRequestScenarioStatus(id: string): Promise<void> {
    const target = await this.requestScenarioRepository.getById(id);
    if (!target) return;
    await this.requestScenarioRepository.update(id, { status: !target.status });
  }

  async duplicateRequestScenario(id: string): Promise<RequestScenario | null> {
    const target = await this.requestScenarioRepository.getById(id);
    if (!target) return null;

    return this.requestScenarioRepository.create({
      apiId: target.apiId,
      name: `${target.name} (Copy)`,
      description: target.description,
      headers: target.headers,
      queryParams: target.queryParams,
      pathParams: target.pathParams,
      body: target.body,
      bodyType: target.bodyType,
      matchType: target.matchType,
      priority: target.priority,
      status: false,
    });
  }

  deleteRequestScenario(id: string): Promise<void> {
    return this.requestScenarioRepository.softDelete(id);
  }

  async toggleResponseScenarioStatus(id: string): Promise<void> {
    const target = await this.responseScenarioRepository.getById(id);
    if (!target) return;
    await this.responseScenarioRepository.update(id, { status: !target.status });
  }

  async duplicateResponseScenario(id: string): Promise<ResponseScenario | null> {
    const target = await this.responseScenarioRepository.getById(id);
    if (!target) return null;

    return this.responseScenarioRepository.create({
      requestScenarioId: target.requestScenarioId,
      name: `${target.name} (Copy)`,
      description: target.description,
      statusCode: target.statusCode,
      headers: target.headers,
      body: target.body,
      responseType: target.responseType ?? 'JSON',
      filePath: target.filePath ?? null,
      fileName: target.fileName ?? null,
      delayMs: target.delayMs,
      weight: target.weight,
      priority: target.priority,
      status: target.status,
    });
  }

  deleteResponseScenario(id: string): Promise<void> {
    return this.responseScenarioRepository.softDelete(id);
  }

  uploadResponseFile(file: File): Promise<{ filePath: string; fileName: string }> {
    return this.responseScenarioRepository.uploadFile(file);
  }
}
