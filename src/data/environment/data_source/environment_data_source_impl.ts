import { Environment } from '@/src/domain/environment/entity/environment';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getEnvironmentsByProjectId(projectId: string): Promise<Environment[]> {
  const database = await callDatabase<{ environments: Environment[] }>('getDatabase');
  return database.environments.filter((environment) => environment.projectId === projectId);
}

export async function getEnvironmentById(id: string): Promise<Environment | null> {
  const database = await callDatabase<{ environments: Environment[] }>('getDatabase');
  return database.environments.find((environment) => environment.id === id) || null;
}

export async function createEnvironment(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Environment> {
  return callDatabase<Environment>('createEnvironment', input);
}

export async function updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment> {
  return callDatabase<Environment>('updateEnvironment', { id, input });
}

export async function softDeleteEnvironment(id: string): Promise<void> {
  await callDatabase<void>('softDeleteEnvironment', { id });
}

export async function removeEnvironmentsByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeEnvironmentsByProjectId is server-only');
}
