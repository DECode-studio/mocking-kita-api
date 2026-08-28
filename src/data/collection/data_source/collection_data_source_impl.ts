import prisma from '@/src/core/db/prisma-client';
import { Collection } from '@/src/domain/collection/entity/collection';

function toCollectionDomain(c: {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Collection {
  return {
    id: c.id,
    projectId: c.projectId,
    name: c.name,
    description: c.description ?? undefined,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  };
}

export async function getCollectionsByProjectId(projectId: string): Promise<Collection[]> {
  const rows = await prisma.collection.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toCollectionDomain);
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const row = await prisma.collection.findUnique({
    where: { id },
  });
  return row ? toCollectionDomain(row) : null;
}

export async function createCollection(
  input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<Collection> {
  const row = await prisma.collection.create({
    data: {
      id: input.id,
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toCollectionDomain(row);
}

export async function updateCollection(id: string, input: Partial<Collection>): Promise<Collection> {
  const current = await getCollectionById(id);
  if (!current) throw new Error(`Collection ${id} not found`);

  const updatedRow = await prisma.collection.update({
    where: { id },
    data: {
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
      ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
      ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
    },
  });
  return toCollectionDomain(updatedRow);
}

export async function softDeleteCollection(id: string): Promise<void> {
  const current = await getCollectionById(id);
  if (!current) throw new Error(`Collection ${id} not found`);

  await prisma.api.updateMany({
    where: { collectionId: id },
    data: { collectionId: null },
  });

  await updateCollection(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function removeCollectionsByProjectId(projectId: string): Promise<void> {
  await prisma.collection.deleteMany({
    where: { projectId },
  });
}
