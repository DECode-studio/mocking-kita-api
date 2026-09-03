import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { createRequestScenarioRemote, getRequestScenario, listRequestScenariosByApi, softDeleteRequestScenarioRemote, updateRequestScenarioRemote } from '../api/request_scenario_api_client';

export async function getRequestScenariosByApiId(apiId: string): Promise<RequestScenario[]> {
  return listRequestScenariosByApi(apiId);
}

export async function getRequestScenarioById(id: string): Promise<RequestScenario | null> {
  return getRequestScenario(id);
}

export async function createRequestScenario(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<RequestScenario> {
  return createRequestScenarioRemote(input);
}

export async function updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
  return updateRequestScenarioRemote(id, input);
}

export async function softDeleteRequestScenario(id: string): Promise<void> {
  await softDeleteRequestScenarioRemote(id);
}

export async function removeRequestScenariosByApiId(_apiId: string): Promise<void> {
  throw new Error('removeRequestScenariosByApiId is server-only');
}
