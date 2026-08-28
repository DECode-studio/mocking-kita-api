import prisma from '@/src/core/db/prisma-client';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';

function toApiDomain(api: {
  id: string;
  projectId: string;
  collectionId: string | null;
  name: string;
  description: string | null;
  path: string;
  methodRequest: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ApiCollection {
  return {
    id: api.id,
    projectId: api.projectId,
    collectionId: api.collectionId ?? undefined,
    name: api.name,
    description: api.description ?? undefined,
    path: api.path,
    methodRequest: api.methodRequest as any,
    status: api.status,
    createdAt: api.createdAt.toISOString(),
    updatedAt: api.updatedAt.toISOString(),
    deletedAt: api.deletedAt ? api.deletedAt.toISOString() : null,
  };
}

export async function getApisByProjectId(projectId: string): Promise<ApiCollection[]> {
  const rows = await prisma.api.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toApiDomain);
}

export async function getApiById(id: string): Promise<ApiCollection | null> {
  const row = await prisma.api.findUnique({
    where: { id },
  });
  return row ? toApiDomain(row) : null;
}

export async function createApi(
  input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<ApiCollection> {
  const row = await prisma.api.create({
    data: {
      id: input.id,
      projectId: input.projectId,
      collectionId: input.collectionId ?? null,
      name: input.name,
      description: input.description ?? null,
      path: input.path,
      methodRequest: input.methodRequest,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toApiDomain(row);
}

export async function updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
  const current = await getApiById(id);
  if (!current) throw new Error(`API Collection ${id} not found`);

  const updatedRow = await prisma.api.update({
    where: { id },
    data: {
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.collectionId !== undefined && { collectionId: input.collectionId ?? null }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.path !== undefined && { path: input.path }),
      ...(input.methodRequest !== undefined && { methodRequest: input.methodRequest }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
      ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
      ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
    },
  });
  return toApiDomain(updatedRow);
}

export async function softDeleteApi(id: string): Promise<void> {
  await updateApi(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function removeApisByProjectId(projectId: string): Promise<void> {
  await prisma.api.deleteMany({
    where: { projectId },
  });
}
