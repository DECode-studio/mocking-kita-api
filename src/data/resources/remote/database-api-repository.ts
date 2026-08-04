import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { Environment } from '@/src/domain/environment/entity/environment';
import { MockApiDatabase } from '@/src/data/database/mock-api-database';
import { Project } from '@/src/domain/project/entity/project';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { DatabaseRepository } from '@/src/data/database/database-repository';
import { callDatabase } from '@/src/data/repositories/shared/database-proxy-client';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ApiCollectionRemoteRepository } from '@/src/data/api/repository/api_repository';
import { ApiEnvironmentRemoteRepository } from '@/src/data/api/repository/api_environment_repository';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';

const projectRepo = new ProjectRemoteRepository();
const environmentRepo = new EnvironmentRemoteRepository();
const apiRepo = new ApiCollectionRemoteRepository();
const apiEnvironmentRepo = new ApiEnvironmentRemoteRepository();
const requestScenarioRepo = new RequestScenarioRemoteRepository();
const responseScenarioRepo = new ResponseScenarioRemoteRepository();

export class RemoteDatabaseRepository implements DatabaseRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('getDatabase');
  }

  async saveDatabase(data: MockApiDatabase): Promise<void> {
    await callDatabase<void>('saveDatabase', data);
  }

  async resetDatabase(): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('resetDatabase');
  }

  async importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return callDatabase<MockApiDatabase>('importDatabase', { data, mode });
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return projectRepo.create(input);
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return projectRepo.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await projectRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await projectRepo.restore(id);
  }

  async hardDelete(id: string): Promise<void> {
    await projectRepo.hardDelete(id);
  }

  async getAll(): Promise<Project[]> {
    return projectRepo.getAll();
  }

  async getById(id: string): Promise<Project | null> {
    return projectRepo.getById(id);
  }

  async createEnvironment(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    return environmentRepo.create(input);
  }

  async updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment> {
    return environmentRepo.update(id, input);
  }

  async softDeleteEnvironment(id: string): Promise<void> {
    await environmentRepo.softDelete(id);
  }

  async getByProjectId(projectId: string): Promise<Environment[]> {
    return environmentRepo.getByProjectId(projectId);
  }

  async getEnvironmentById(id: string): Promise<Environment | null> {
    return environmentRepo.getById(id);
  }

  async createApi(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    return apiRepo.create(input);
  }

  async updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return apiRepo.update(id, input);
  }

  async softDeleteApi(id: string): Promise<void> {
    await apiRepo.softDelete(id);
  }

  async getByProjectIdApi(projectId: string): Promise<ApiCollection[]> {
    return apiRepo.getByProjectId(projectId);
  }

  async getApiById(id: string): Promise<ApiCollection | null> {
    return apiRepo.getById(id);
  }

  async upsertApiEnv(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ApiEnvironment> {
    return apiEnvironmentRepo.upsert(input);
  }

  async getByApiIdApiEnv(apiId: string): Promise<ApiEnvironment[]> {
    return apiEnvironmentRepo.getByApiId(apiId);
  }

  async getApiEnv(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    return apiEnvironmentRepo.get(apiId, environmentId);
  }

  async createReqScenario(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return requestScenarioRepo.create(input);
  }

  async updateReqScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return requestScenarioRepo.update(id, input);
  }

  async softDeleteReqScenario(id: string): Promise<void> {
    await requestScenarioRepo.softDelete(id);
  }

  async getByApiIdReqScenario(apiId: string): Promise<RequestScenario[]> {
    return requestScenarioRepo.getByApiId(apiId);
  }

  async getReqScenarioById(id: string): Promise<RequestScenario | null> {
    return requestScenarioRepo.getById(id);
  }

  async createRespScenario(
    input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ResponseScenario> {
    return responseScenarioRepo.create(input);
  }

  async updateRespScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return responseScenarioRepo.update(id, input);
  }

  async softDeleteRespScenario(id: string): Promise<void> {
    await responseScenarioRepo.softDelete(id);
  }

  async getByReqScenarioIdRespScenario(requestScenarioId: string): Promise<ResponseScenario[]> {
    return responseScenarioRepo.getByRequestScenarioId(requestScenarioId);
  }

  async getRespScenarioById(id: string): Promise<ResponseScenario | null> {
    return responseScenarioRepo.getById(id);
  }
}

export const dbRepository = new RemoteDatabaseRepository();
