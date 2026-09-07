import prisma from '@/src/core/db/prisma-client';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { toApiDomain } from './api.mapper';

export async function getApisByProjectId(projectId: string): Promise<ApiCollection[]> {
  const rows = await prisma.api.findMany({
    where: { projectId },
    include: { pics: { include: { account: true } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toApiDomain);
}

export async function getAllApis(): Promise<ApiCollection[]> {
  const rows = await prisma.api.findMany({
    include: { pics: { include: { account: true } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toApiDomain);
}

export async function getApiById(id: string): Promise<ApiCollection | null> {
  const row = await prisma.api.findUnique({
    where: { id },
    include: { pics: { include: { account: true } } },
  });
  return row ? toApiDomain(row) : null;
}

export async function createApi(
  input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<ApiCollection> {
  const picIds = (input.picIds || []).filter(Boolean);
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
      ...(picIds.length > 0 && {
        pics: {
          create: picIds.map((accountId) => ({ accountId })),
        },
      }),
    },
    include: { pics: { include: { account: true } } },
  });
  return toApiDomain(row);
}

export async function updateApi(id: string, input: Partial<ApiCollection>): Promise<ApiCollection> {
  const current = await getApiById(id);
  if (!current) throw new Error(`API Collection ${id} not found`);

  if (input.picIds !== undefined) {
    await prisma.apiPic.deleteMany({ where: { apiId: id } });
    const picIds = (input.picIds || []).filter(Boolean);
    if (picIds.length > 0) {
      await prisma.apiPic.createMany({
        data: picIds.map((accountId) => ({ apiId: id, accountId })),
      });
    }
  }

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
    include: { pics: { include: { account: true } } },
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
