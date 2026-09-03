import { Collection } from '@/src/domain/collection/entity/collection';
import { createCollectionRemote, getCollection, listCollectionsByProject, softDeleteCollectionRemote, updateCollectionRemote } from '../api/collection_api_client';

export async function getCollectionsByProjectId(projectId: string): Promise<Collection[]> {
  return listCollectionsByProject(projectId);
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  return getCollection(id);
}

export async function createCollection(input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }): Promise<Collection> {
  return createCollectionRemote(input);
}

export async function updateCollection(id: string, input: Partial<Collection>): Promise<Collection> {
  return updateCollectionRemote(id, input);
}

export async function softDeleteCollection(id: string): Promise<void> {
  await softDeleteCollectionRemote(id);
}

export async function removeCollectionsByProjectId(_projectId: string): Promise<void> {
  throw new Error('removeCollectionsByProjectId is server-only');
}
