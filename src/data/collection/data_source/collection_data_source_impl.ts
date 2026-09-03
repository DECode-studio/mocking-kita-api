import { Collection } from '@/src/domain/collection/entity/collection';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getCollectionsByProjectId(projectId: string): Promise<Collection[]> {
  const database = await callDatabase<{ collections: Collection[] }>('getDatabase');
  return database.collections.filter((collection) => collection.projectId === projectId);
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const database = await callDatabase<{ collections: Collection[] }>('getDatabase');
  return database.collections.find((collection) => collection.id === id) || null;
}

export async function createCollection(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Collection> {
  return callDatabase<Collection>('createCollection', input);
}

export async function updateCollection(id: string, input: Partial<Collection>): Promise<Collection> {
  return callDatabase<Collection>('updateCollection', { id, input });
}

export async function softDeleteCollection(id: string): Promise<void> {
  await callDatabase<void>('softDeleteCollection', { id });
}

export async function removeCollectionsByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeCollectionsByProjectId is server-only');
}
