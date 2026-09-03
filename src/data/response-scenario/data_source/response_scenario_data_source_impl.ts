import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getResponseScenariosByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
  const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
  return database.responseScenarios.filter((scenario) => scenario.requestScenarioId === requestScenarioId);
}

export async function getResponseScenarioById(id: string): Promise<ResponseScenario | null> {
  const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
  return database.responseScenarios.find((scenario) => scenario.id === id) || null;
}

export async function createResponseScenario(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<ResponseScenario> {
  return callDatabase<ResponseScenario>('createRespScenario', input);
}

export async function updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
  return callDatabase<ResponseScenario>('updateRespScenario', { id, input });
}

export async function softDeleteResponseScenario(id: string): Promise<void> {
  await callDatabase<void>('softDeleteRespScenario', { id });
}

export async function removeResponseScenariosByRequestScenarioId(_requestScenarioId: string): Promise<void> {
  throw new Error('removeResponseScenariosByRequestScenarioId is server-only');
}
