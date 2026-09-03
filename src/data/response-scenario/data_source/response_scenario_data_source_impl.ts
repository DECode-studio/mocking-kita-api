import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { createResponseScenarioRemote, getResponseScenario, listResponseScenariosByRequestScenario, softDeleteResponseScenarioRemote, updateResponseScenarioRemote } from '../api/response_scenario_api_client';

export async function getResponseScenariosByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
  return listResponseScenariosByRequestScenario(requestScenarioId);
}

export async function getResponseScenarioById(id: string): Promise<ResponseScenario | null> {
  return getResponseScenario(id);
}

export async function createResponseScenario(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<ResponseScenario> {
  return createResponseScenarioRemote(input);
}

export async function updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
  return updateResponseScenarioRemote(id, input);
}

export async function softDeleteResponseScenario(id: string): Promise<void> {
  await softDeleteResponseScenarioRemote(id);
}

export async function removeResponseScenariosByRequestScenarioId(_requestScenarioId: string): Promise<void> {
  throw new Error('removeResponseScenariosByRequestScenarioId is server-only');
}
