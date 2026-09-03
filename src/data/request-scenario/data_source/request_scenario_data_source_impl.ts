import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getRequestScenariosByApiId(apiId: string): Promise<RequestScenario[]> {
  const database = await callDatabase<{ requestScenarios: RequestScenario[] }>('getDatabase');
  return database.requestScenarios.filter((scenario) => scenario.apiId === apiId);
}

export async function getRequestScenarioById(id: string): Promise<RequestScenario | null> {
  const database = await callDatabase<{ requestScenarios: RequestScenario[] }>('getDatabase');
  return database.requestScenarios.find((scenario) => scenario.id === id) || null;
}

export async function createRequestScenario(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<RequestScenario> {
  return callDatabase<RequestScenario>('createReqScenario', input);
}

export async function updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
  return callDatabase<RequestScenario>('updateReqScenario', { id, input });
}

export async function softDeleteRequestScenario(id: string): Promise<void> {
  await callDatabase<void>('softDeleteReqScenario', { id });
}

export async function removeRequestScenariosByApiId(_apiId: string): Promise<void> {
  throw new Error('removeRequestScenariosByApiId is server-only');
}
