import {
  getApisByProjectId,
  softDeleteApi,
} from './api-local-resource';
import {
  removeApiEnvironmentsByApiId,
  removeApiEnvironmentsByEnvironmentId,
} from './api-environment-local-resource';
import { removeEnvironmentsByProjectId, softDeleteEnvironment } from './environment-local-resource';
import {
  getRequestScenariosByApiId,
  removeRequestScenariosByApiId,
  softDeleteRequestScenario,
} from './request-scenario-local-resource';
import {
  removeResponseScenariosByRequestScenarioId,
} from './response-scenario-local-resource';
import { hardDeleteProject } from './project-local-resource';

export function deleteApiCascade(apiId: string): void {
  const requestScenarios = getRequestScenariosByApiId(apiId);
  for (const requestScenario of requestScenarios) {
    removeResponseScenariosByRequestScenarioId(requestScenario.id);
  }
  removeRequestScenariosByApiId(apiId);
  removeApiEnvironmentsByApiId(apiId);
  softDeleteApi(apiId);
}

export function deleteEnvironmentCascade(environmentId: string): void {
  removeApiEnvironmentsByEnvironmentId(environmentId);
  softDeleteEnvironment(environmentId);
}

export function deleteRequestScenarioCascade(requestScenarioId: string): void {
  removeResponseScenariosByRequestScenarioId(requestScenarioId);
  softDeleteRequestScenario(requestScenarioId);
}

export function deleteProjectCascade(projectId: string): void {
  const apiIds = getApisByProjectId(projectId).map((api) => api.id);
  for (const apiId of apiIds) {
    deleteApiCascade(apiId);
  }
  removeEnvironmentsByProjectId(projectId);
  hardDeleteProject(projectId);
}
