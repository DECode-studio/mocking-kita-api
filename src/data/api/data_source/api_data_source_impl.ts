import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getApisByProjectId(projectId: string): Promise<ApiCollection[]> {
  const database = await callDatabase<{ apiCollections: ApiCollection[] }>('getDatabase');
  return database.apiCollections.filter((api) => api.projectId === projectId);
}

export async function getApiById(id: string): Promise<ApiCollection | null> {
  const database = await callDatabase<{ apiCollections: ApiCollection[] }>('getDatabase');
  return database.apiCollections.find((api) => api.id === id) || null;
}

export async function createApi(input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<ApiCollection> {
  return callDatabase<ApiCollection>('createApi', input);
}

export async function updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
  return callDatabase<ApiCollection>('updateApi', { id, input });
}

export async function softDeleteApi(id: string): Promise<void> {
  await callDatabase<void>('softDeleteApi', { id });
}

export async function removeApisByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeApisByProjectId is server-only');
}
