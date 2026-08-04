import { MockApiDatabase } from '@/src/data/database/mock-api-database';
import { DatabaseRepository } from '@/src/data/database/database-repository';
import { generateId } from '@/src/core/utils/uuid';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { deleteApiCascade, deleteEnvironmentCascade, deleteProjectCascade, deleteRequestScenarioCascade } from './database-cascade';
import { readDatabase } from './database-reader';
import { importDatabaseData, resetDatabaseToSeed } from './database-import';
import {
  createApi as insertApi,
  getApiById,
  getApisByProjectId,
  updateApi as patchApi,
  softDeleteApi as deleteApi,
} from './api-local-resource';
import {
  createEnvironment as insertEnvironment,
  getEnvironmentById,
  getEnvironmentsByProjectId,
  updateEnvironment as patchEnvironment,
  softDeleteEnvironment as deleteEnvironment,
} from './environment-local-resource';
import {
  createProject as insertProject,
  getProjectById,
  updateProject as patchProject,
  softDeleteProject as deleteProject,
  restoreProject as restoreProjectRow,
  hardDeleteProject as hardDeleteProjectRow,
} from './project-local-resource';
import {
  createRequestScenario as insertRequestScenario,
  getRequestScenarioById,
  getRequestScenariosByApiId,
  updateRequestScenario as patchRequestScenario,
  softDeleteRequestScenario as deleteRequestScenario,
} from './request-scenario-local-resource';
import {
  createResponseScenario as insertResponseScenario,
  getResponseScenarioById,
  getResponseScenariosByRequestScenarioId,
  updateResponseScenario as patchResponseScenario,
  softDeleteResponseScenario as deleteResponseScenario,
} from './response-scenario-local-resource';
import { getApiEnvironment, getApiEnvironmentsByApiId, removeApiEnvironmentsByApiId, removeApiEnvironmentsByEnvironmentId, upsertApiEnvironment } from './api-environment-local-resource';
import { seedDatabase } from './database-writer';

export class LocalDatabaseRepository implements DatabaseRepository {
  async getDatabase(): Promise<MockApiDatabase> {
    return readDatabase();
  }

  async saveDatabase(data: MockApiDatabase): Promise<void> {
    seedDatabase(data);
  }

  async resetDatabase(): Promise<MockApiDatabase> {
    return resetDatabaseToSeed();
  }

  async importDatabase(importedData: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return importDatabaseData(importedData, mode);
  }

  async getAll(): Promise<Project[]> {
    return readDatabase().projects;
  }

  async getById(id: string): Promise<Project | null> {
    return getProjectById(id);
  }

  async create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date().toISOString();
    return insertProject({
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, input: Partial<Project>): Promise<Project> {
    return patchProject(id, input);
  }

  async softDelete(id: string): Promise<void> {
    deleteProject(id);
  }

  async restore(id: string): Promise<void> {
    restoreProjectRow(id);
  }

  async hardDelete(id: string): Promise<void> {
    deleteProjectCascade(id);
  }

  async getByProjectId(projectId: string): Promise<Environment[]> {
    return getEnvironmentsByProjectId(projectId);
  }

  async getEnvironmentById(id: string): Promise<Environment | null> {
    return getEnvironmentById(id);
  }

  async createEnvironment(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    const now = new Date().toISOString();
    return insertEnvironment({
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment> {
    return patchEnvironment(id, input);
  }

  async softDeleteEnvironment(id: string): Promise<void> {
    deleteEnvironmentCascade(id);
  }

  async getByProjectIdApi(projectId: string): Promise<ApiCollection[]> {
    return getApisByProjectId(projectId);
  }

  async getApiById(id: string): Promise<ApiCollection | null> {
    return getApiById(id);
  }

  async createApi(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCollection> {
    const now = new Date().toISOString();
    return insertApi({
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
    return patchApi(id, input);
  }

  async softDeleteApi(id: string): Promise<void> {
    deleteApiCascade(id);
  }

  async getByApiIdApiEnv(apiId: string): Promise<ApiEnvironment[]> {
    return getApiEnvironmentsByApiId(apiId);
  }

  async getApiEnv(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
    return getApiEnvironment(apiId, environmentId);
  }

  async upsertApiEnv(
    input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ApiEnvironment> {
    return upsertApiEnvironment(input);
  }

  async getByApiIdReqScenario(apiId: string): Promise<RequestScenario[]> {
    return getRequestScenariosByApiId(apiId);
  }

  async getReqScenarioById(id: string): Promise<RequestScenario | null> {
    return getRequestScenarioById(id);
  }

  async createReqScenario(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    const now = new Date().toISOString();
    return insertRequestScenario({
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateReqScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return patchRequestScenario(id, input);
  }

  async softDeleteReqScenario(id: string): Promise<void> {
    deleteRequestScenarioCascade(id);
  }

  async getByReqScenarioIdRespScenario(requestScenarioId: string): Promise<ResponseScenario[]> {
    return getResponseScenariosByRequestScenarioId(requestScenarioId);
  }

  async getRespScenarioById(id: string): Promise<ResponseScenario | null> {
    return getResponseScenarioById(id);
  }

  async createRespScenario(
    input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ResponseScenario> {
    const now = new Date().toISOString();
    return insertResponseScenario({
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateRespScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return patchResponseScenario(id, input);
  }

  async softDeleteRespScenario(id: string): Promise<void> {
    deleteResponseScenario(id);
  }
}

export const dbRepository = new LocalDatabaseRepository();
