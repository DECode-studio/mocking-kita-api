import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { createApiRemote, getApi, listApisByProject, softDeleteApiRemote, updateApiRemote } from '../api/api_collection_api_client';

export async function getApisByProjectId(projectId: string): Promise<ApiCollection[]> {
  return listApisByProject(projectId);
}

export async function getApiById(id: string): Promise<ApiCollection | null> {
  return getApi(id);
}

export async function createApi(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<ApiCollection> {
  return createApiRemote(input);
}

export async function updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
  return updateApiRemote(id, input);
}

export async function softDeleteApi(id: string): Promise<void> {
  await softDeleteApiRemote(id);
}

export async function removeApisByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeApisByProjectId is server-only');
}
