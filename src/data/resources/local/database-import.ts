import { generateId } from '@/src/core/utils/uuid';
import { MockApiDatabase } from '@/src/data/database/mock-api-database';
import { DEFAULT_VERSION } from './database-constants';
import { readDatabase } from './database-reader';
import { seedDatabase } from './database-writer';

export async function resetDatabaseToSeed(): Promise<MockApiDatabase> {
  const { INITIAL_SEED_DATA } = await import('@/src/data/database/seed-data');
  seedDatabase(INITIAL_SEED_DATA);
  return INITIAL_SEED_DATA;
}

export function importDatabaseData(importedData: MockApiDatabase, mode: 'replace' | 'merge'): MockApiDatabase {
  const current = readDatabase();

  if (mode === 'replace') {
    const updated: MockApiDatabase = {
      version: importedData.version || DEFAULT_VERSION,
      projects: importedData.projects || [],
      environments: importedData.environments || [],
      apiCollections: importedData.apiCollections || [],
      apiEnvironments: importedData.apiEnvironments || [],
      requestScenarios: importedData.requestScenarios || [],
      responseScenarios: importedData.responseScenarios || [],
    };
    seedDatabase(updated);
    return updated;
  }

  const idMap = new Map<string, string>();
  const remapId = (oldId: string) => {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, generateId());
    }
    return idMap.get(oldId)!;
  };

  const newProjects = (importedData.projects || []).map((project) => ({
    ...project,
    id: remapId(project.id),
  }));

  const newEnvironments = (importedData.environments || []).map((environment) => ({
    ...environment,
    id: remapId(environment.id),
    projectId: idMap.get(environment.projectId) || environment.projectId,
  }));

  const newApis = (importedData.apiCollections || []).map((api) => ({
    ...api,
    id: remapId(api.id),
    projectId: idMap.get(api.projectId) || api.projectId,
  }));

  const newApiEnvs = (importedData.apiEnvironments || []).map((apiEnv) => ({
    ...apiEnv,
    id: remapId(apiEnv.id),
    apiId: idMap.get(apiEnv.apiId) || apiEnv.apiId,
    environmentId: idMap.get(apiEnv.environmentId) || apiEnv.environmentId,
  }));

  const newReqs = (importedData.requestScenarios || []).map((req) => ({
    ...req,
    id: remapId(req.id),
    apiId: idMap.get(req.apiId) || req.apiId,
  }));

  const newResps = (importedData.responseScenarios || []).map((res) => ({
    ...res,
    id: remapId(res.id),
    requestScenarioId: idMap.get(res.requestScenarioId) || res.requestScenarioId,
  }));

  const merged: MockApiDatabase = {
    version: current.version || importedData.version || DEFAULT_VERSION,
    projects: [...current.projects, ...newProjects],
    environments: [...current.environments, ...newEnvironments],
    apiCollections: [...current.apiCollections, ...newApis],
    apiEnvironments: [...current.apiEnvironments, ...newApiEnvs],
    requestScenarios: [...current.requestScenarios, ...newReqs],
    responseScenarios: [...current.responseScenarios, ...newResps],
  };

  seedDatabase(merged);
  return merged;
}
