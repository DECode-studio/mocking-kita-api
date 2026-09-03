import { Environment } from '@/src/domain/environment/entity/environment';
import { createEnvironmentRemote, getEnvironment, listEnvironmentsByProject, softDeleteEnvironmentRemote, updateEnvironmentRemote } from '../api/environment_api_client';

export async function getEnvironmentsByProjectId(projectId: string): Promise<Environment[]> {
  return listEnvironmentsByProject(projectId);
}

export async function getEnvironmentById(id: string): Promise<Environment | null> {
  return getEnvironment(id);
}

export async function createEnvironment(input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Environment> {
  return createEnvironmentRemote(input);
}

export async function updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment> {
  return updateEnvironmentRemote(id, input);
}

export async function softDeleteEnvironment(id: string): Promise<void> {
  await softDeleteEnvironmentRemote(id);
}

export async function removeEnvironmentsByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeEnvironmentsByProjectId is server-only');
}
