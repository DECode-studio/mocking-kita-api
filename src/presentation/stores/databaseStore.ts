import { create } from 'zustand';
import { MockApiDatabase } from '../../data/database/mock-api-database';
import { ApiEnvironment } from '../../domain/api/entity/api_environment';
import { ApiCollection } from '../../domain/api/entity/api_collection';
import { Environment } from '../../domain/environment/entity/environment';
import { Project } from '../../domain/project/entity/project';
import { RequestScenario } from '../../domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '../../domain/response-scenario/entity/response_scenario';
import { dbRepository } from '../../data/resources/remote/database-api-repository';
import { generateId } from '../../core/utils/uuid';
import { getErrorMessage } from '../../core/utils/error';

interface DatabaseState {
  db: MockApiDatabase;
  isLoading: boolean;
  selectedProjectId: string | null;
  selectedApiId: string | null;
  
  // Actions
  loadDatabase: () => Promise<void>;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedApiId: (id: string | null) => void;

  // Project Actions
  createProject: (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, input: Partial<Project>) => Promise<Project>;
  toggleProjectStatus: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  softDeleteProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  hardDeleteProject: (id: string) => Promise<void>;

  // Environment Actions
  createEnvironment: (input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Environment>;
  updateEnvironment: (id: string, input: Partial<Environment>) => Promise<Environment>;
  toggleEnvironmentStatus: (id: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;

  // ApiCollection Actions
  createApiCollection: (input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiCollection>;
  updateApiCollection: (id: string, input: Partial<ApiCollection>) => Promise<ApiCollection>;
  toggleApiCollectionStatus: (id: string) => Promise<void>;
  duplicateApiCollection: (id: string) => Promise<ApiCollection>;
  deleteApiCollection: (id: string) => Promise<void>;

  // ApiEnvironment Actions
  upsertApiEnvironment: (input: { apiId: string; environmentId: string; enabled: boolean; pathOverride?: string }) => Promise<void>;

  // RequestScenario Actions
  createRequestScenario: (input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RequestScenario>;
  updateRequestScenario: (id: string, input: Partial<RequestScenario>) => Promise<RequestScenario>;
  toggleRequestScenarioStatus: (id: string) => Promise<void>;
  duplicateRequestScenario: (id: string) => Promise<RequestScenario>;
  deleteRequestScenario: (id: string) => Promise<void>;

  // ResponseScenario Actions
  createResponseScenario: (input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ResponseScenario>;
  updateResponseScenario: (id: string, input: Partial<ResponseScenario>) => Promise<ResponseScenario>;
  toggleResponseScenarioStatus: (id: string) => Promise<void>;
  duplicateResponseScenario: (id: string) => Promise<ResponseScenario>;
  deleteResponseScenario: (id: string) => Promise<void>;

  // Backup / Reset / Import
  importDatabase: (data: MockApiDatabase, mode: 'replace' | 'merge') => Promise<void>;
  resetDatabase: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  db: {
    version: '1.0.0',
    projects: [],
    environments: [],
    apiCollections: [],
    apiEnvironments: [],
    requestScenarios: [],
    responseScenarios: [],
  },
  isLoading: true,
  selectedProjectId: null,
  selectedApiId: null,

  loadDatabase: async () => {
    set({ isLoading: true });
    try {
      const data = await dbRepository.getDatabase();
      set({ db: data, isLoading: false });
    } catch (error: unknown) {
      console.error('Error loading DB:', getErrorMessage(error, 'Unknown database error'));
      set({ isLoading: false });
    }
  },

  setSelectedProjectId: (id: string | null) => set({ selectedProjectId: id }),
  setSelectedApiId: (id: string | null) => set({ selectedApiId: id }),

  // --- Project Actions ---
  createProject: async (input) => {
    const created = await dbRepository.create(input);
    await get().loadDatabase();
    return created;
  },

  updateProject: async (id, input) => {
    const updated = await dbRepository.update(id, input);
    await get().loadDatabase();
    return updated;
  },

  toggleProjectStatus: async (id) => {
    const proj = get().db.projects.find((p) => p.id === id);
    if (!proj) return;
    await dbRepository.update(id, { status: !proj.status });
    await get().loadDatabase();
  },

  duplicateProject: async (id) => {
    const currentDb = get().db;
    const origProj = currentDb.projects.find((p) => p.id === id);
    if (!origProj) throw new Error('Project not found');

    const newProj = await dbRepository.create({
      name: `${origProj.name} (Copy)`,
      description: origProj.description,
      status: origProj.status,
    });

    // Duplicate environments
    const origEnvs = currentDb.environments.filter((e) => e.projectId === id);
    const envMap = new Map<string, string>();
    for (const env of origEnvs) {
      const createdEnv = await dbRepository.createEnvironment({
        projectId: newProj.id,
        name: env.name,
        environmentType: env.environmentType,
        publicBaseUrl: env.publicBaseUrl,
        originBaseUrl: env.originBaseUrl,
        status: env.status,
      });
      envMap.set(env.id, createdEnv.id);
    }

    // Duplicate API collections & scenarios
    const origApis = currentDb.apiCollections.filter((a) => a.projectId === id);
    for (const api of origApis) {
      const createdApi = await dbRepository.createApi({
        projectId: newProj.id,
        name: api.name,
        description: api.description,
        path: api.path,
        methodRequest: api.methodRequest,
        status: api.status,
      });

      // Duplicate ApiEnvironments
      const origApiEnvs = currentDb.apiEnvironments.filter((ae) => ae.apiId === api.id);
      for (const ae of origApiEnvs) {
        const newEnvId = envMap.get(ae.environmentId);
        if (newEnvId) {
          await dbRepository.upsertApiEnv({
            apiId: createdApi.id,
            environmentId: newEnvId,
            enabled: ae.enabled,
            pathOverride: ae.pathOverride,
          });
        }
      }

      // Duplicate RequestScenarios
      const origReqs = currentDb.requestScenarios.filter((r) => r.apiId === api.id);
      for (const req of origReqs) {
        const createdReq = await dbRepository.createReqScenario({
          apiId: createdApi.id,
          name: req.name,
          description: req.description,
          headers: req.headers,
          queryParams: req.queryParams,
          pathParams: req.pathParams,
          body: req.body,
          matchType: req.matchType,
          priority: req.priority,
          status: req.status,
        });

        // Duplicate ResponseScenarios
        const origResps = currentDb.responseScenarios.filter((res) => res.requestScenarioId === req.id);
        for (const res of origResps) {
          await dbRepository.createRespScenario({
            requestScenarioId: createdReq.id,
            name: res.name,
            description: res.description,
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.body,
            delayMs: res.delayMs,
            weight: res.weight,
            priority: res.priority,
            status: res.status,
          });
        }
      }
    }

    await get().loadDatabase();
    return newProj;
  },

  softDeleteProject: async (id) => {
    await dbRepository.softDelete(id);
    await get().loadDatabase();
  },

  restoreProject: async (id) => {
    await dbRepository.restore(id);
    await get().loadDatabase();
  },

  hardDeleteProject: async (id) => {
    await dbRepository.hardDelete(id);
    if (get().selectedProjectId === id) set({ selectedProjectId: null });
    await get().loadDatabase();
  },

  // --- Environment Actions ---
  createEnvironment: async (input) => {
    const created = await dbRepository.createEnvironment(input);
    await get().loadDatabase();
    return created;
  },

  updateEnvironment: async (id, input) => {
    const updated = await dbRepository.updateEnvironment(id, input);
    await get().loadDatabase();
    return updated;
  },

  toggleEnvironmentStatus: async (id) => {
    const env = get().db.environments.find((e) => e.id === id);
    if (!env) return;
    await dbRepository.updateEnvironment(id, { status: !env.status });
    await get().loadDatabase();
  },

  deleteEnvironment: async (id) => {
    await dbRepository.softDeleteEnvironment(id);
    await get().loadDatabase();
  },

  // --- ApiCollection Actions ---
  createApiCollection: async (input) => {
    const created = await dbRepository.createApi(input);
    await get().loadDatabase();
    return created;
  },

  updateApiCollection: async (id, input) => {
    const updated = await dbRepository.updateApi(id, input);
    await get().loadDatabase();
    return updated;
  },

  toggleApiCollectionStatus: async (id) => {
    const api = get().db.apiCollections.find((a) => a.id === id);
    if (!api) return;
    await dbRepository.updateApi(id, { status: !api.status });
    await get().loadDatabase();
  },

  duplicateApiCollection: async (id) => {
    const currentDb = get().db;
    const origApi = currentDb.apiCollections.find((a) => a.id === id);
    if (!origApi) throw new Error('API collection not found');

    const createdApi = await dbRepository.createApi({
      projectId: origApi.projectId,
      name: `${origApi.name} (Copy)`,
      description: origApi.description,
      path: origApi.path.includes('_copy') ? `${origApi.path}_1` : `${origApi.path}_copy`,
      methodRequest: origApi.methodRequest,
      status: origApi.status,
    });

    // Copy Request & Response Scenarios
    const origReqs = currentDb.requestScenarios.filter((r) => r.apiId === id);
    for (const req of origReqs) {
      const createdReq = await dbRepository.createReqScenario({
        apiId: createdApi.id,
        name: req.name,
        description: req.description,
        headers: req.headers,
        queryParams: req.queryParams,
        pathParams: req.pathParams,
        body: req.body,
        matchType: req.matchType,
        priority: req.priority,
        status: req.status,
      });

      const origResps = currentDb.responseScenarios.filter((res) => res.requestScenarioId === req.id);
      for (const res of origResps) {
        await dbRepository.createRespScenario({
          requestScenarioId: createdReq.id,
          name: res.name,
          description: res.description,
          statusCode: res.statusCode,
          headers: res.headers,
          body: res.body,
          delayMs: res.delayMs,
          weight: res.weight,
          priority: res.priority,
          status: res.status,
        });
      }
    }

    await get().loadDatabase();
    return createdApi;
  },

  deleteApiCollection: async (id) => {
    await dbRepository.softDeleteApi(id);
    if (get().selectedApiId === id) set({ selectedApiId: null });
    await get().loadDatabase();
  },

  // --- ApiEnvironment Actions ---
  upsertApiEnvironment: async (input) => {
    await dbRepository.upsertApiEnv(input);
    await get().loadDatabase();
  },

  // --- RequestScenario Actions ---
  createRequestScenario: async (input) => {
    const created = await dbRepository.createReqScenario(input);
    await get().loadDatabase();
    return created;
  },

  updateRequestScenario: async (id, input) => {
    const updated = await dbRepository.updateReqScenario(id, input);
    await get().loadDatabase();
    return updated;
  },

  toggleRequestScenarioStatus: async (id) => {
    const req = get().db.requestScenarios.find((r) => r.id === id);
    if (!req) return;
    await dbRepository.updateReqScenario(id, { status: !req.status });
    await get().loadDatabase();
  },

  duplicateRequestScenario: async (id) => {
    const currentDb = get().db;
    const origReq = currentDb.requestScenarios.find((r) => r.id === id);
    if (!origReq) throw new Error('Request scenario not found');

    const createdReq = await dbRepository.createReqScenario({
      apiId: origReq.apiId,
      name: `${origReq.name} (Copy)`,
      description: origReq.description,
      headers: origReq.headers,
      queryParams: origReq.queryParams,
      pathParams: origReq.pathParams,
      body: origReq.body,
      matchType: origReq.matchType,
      priority: origReq.priority,
      status: origReq.status,
    });

    const origResps = currentDb.responseScenarios.filter((res) => res.requestScenarioId === id);
    for (const res of origResps) {
      await dbRepository.createRespScenario({
        requestScenarioId: createdReq.id,
        name: res.name,
        description: res.description,
        statusCode: res.statusCode,
        headers: res.headers,
        body: res.body,
        delayMs: res.delayMs,
        weight: res.weight,
        priority: res.priority,
        status: res.status,
      });
    }

    await get().loadDatabase();
    return createdReq;
  },

  deleteRequestScenario: async (id) => {
    await dbRepository.softDeleteReqScenario(id);
    await get().loadDatabase();
  },

  // --- ResponseScenario Actions ---
  createResponseScenario: async (input) => {
    const created = await dbRepository.createRespScenario(input);
    await get().loadDatabase();
    return created;
  },

  updateResponseScenario: async (id, input) => {
    const updated = await dbRepository.updateRespScenario(id, input);
    await get().loadDatabase();
    return updated;
  },

  toggleResponseScenarioStatus: async (id) => {
    const res = get().db.responseScenarios.find((r) => r.id === id);
    if (!res) return;
    await dbRepository.updateRespScenario(id, { status: !res.status });
    await get().loadDatabase();
  },

  duplicateResponseScenario: async (id) => {
    const origRes = get().db.responseScenarios.find((r) => r.id === id);
    if (!origRes) throw new Error('Response scenario not found');

    const createdRes = await dbRepository.createRespScenario({
      requestScenarioId: origRes.requestScenarioId,
      name: `${origRes.name} (Copy)`,
      description: origRes.description,
      statusCode: origRes.statusCode,
      headers: origRes.headers,
      body: origRes.body,
      delayMs: origRes.delayMs,
      weight: origRes.weight,
      priority: origRes.priority,
      status: origRes.status,
    });

    await get().loadDatabase();
    return createdRes;
  },

  deleteResponseScenario: async (id) => {
    await dbRepository.softDeleteRespScenario(id);
    await get().loadDatabase();
  },

  // --- Backup / Reset / Import ---
  importDatabase: async (data, mode) => {
    await dbRepository.importDatabase(data, mode);
    await get().loadDatabase();
  },

  resetDatabase: async () => {
    await dbRepository.resetDatabase();
    await get().loadDatabase();
  },
}));
