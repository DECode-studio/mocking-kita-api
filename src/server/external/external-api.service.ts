import prisma from '@/src/core/db/prisma-client';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';

export interface UpsertApiInput {
  projectId: string;
  collectionId?: string | null;
  name: string;
  description?: string | null;
  path: string;
  methodRequest: string;
  status?: boolean;
}

export async function upsertExternalApi(input: UpsertApiInput) {
  if (!input.projectId || !input.path || !input.methodRequest || !input.name) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: "Fields 'projectId', 'path', 'methodRequest', and 'name' are required",
    };
  }

  // Normalize path & methodRequest
  let normalizedPath = input.path.trim();
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  const normalizedMethod = input.methodRequest.trim().toUpperCase();

  // Verify Project exists
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
  });

  if (!project) {
    return {
      success: false,
      status: 404,
      code: 'NOT_FOUND',
      message: `Project with ID '${input.projectId}' not found`,
    };
  }

  // Check if API already exists by (projectId, path, methodRequest) (including soft-deleted)
  const existingApi = await prisma.api.findFirst({
    where: {
      projectId: input.projectId,
      path: normalizedPath,
      methodRequest: normalizedMethod,
    },
  });

  let action: 'CREATED' | 'UPDATED' = 'CREATED';
  let apiRecord;

  if (existingApi) {
    action = 'UPDATED';
    apiRecord = await prisma.api.update({
      where: { id: existingApi.id },
      data: {
        name: input.name,
        description: input.description !== undefined ? input.description : existingApi.description,
        collectionId: input.collectionId !== undefined ? input.collectionId : existingApi.collectionId,
        status: input.status !== undefined ? input.status : existingApi.status,
        deletedAt: null, // restore if it was soft-deleted
        updatedAt: new Date(),
      },
    });
  } else {
    action = 'CREATED';
    apiRecord = await prisma.api.create({
      data: {
        projectId: input.projectId,
        collectionId: input.collectionId ?? null,
        name: input.name,
        description: input.description ?? null,
        path: normalizedPath,
        methodRequest: normalizedMethod,
        status: input.status ?? true,
      },
    });
  }

  clearInternalProxyCache();

  return {
    success: true,
    status: action === 'CREATED' ? 201 : 200,
    action,
    message: `API ${action === 'CREATED' ? 'created' : 'updated'} successfully`,
    data: {
      id: apiRecord.id,
      projectId: apiRecord.projectId,
      collectionId: apiRecord.collectionId,
      name: apiRecord.name,
      description: apiRecord.description,
      path: apiRecord.path,
      methodRequest: apiRecord.methodRequest,
      status: apiRecord.status,
      createdAt: apiRecord.createdAt.toISOString(),
      updatedAt: apiRecord.updatedAt.toISOString(),
    },
  };
}

export async function listExternalApis(params: {
  projectId: string;
  collectionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  if (!params.projectId) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: "Query parameter 'projectId' is required",
    };
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereCondition: any = {
    projectId: params.projectId,
    deletedAt: null,
  };

  if (params.collectionId) {
    whereCondition.collectionId = params.collectionId;
  }

  if (params.search) {
    const searchLower = params.search.trim();
    whereCondition.OR = [
      { name: { contains: searchLower, mode: 'insensitive' } },
      { path: { contains: searchLower, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.api.count({ where: whereCondition }),
    prisma.api.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
  ]);

  const formattedData = rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    collectionId: row.collectionId,
    name: row.name,
    description: row.description,
    path: row.path,
    methodRequest: row.methodRequest,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    success: true,
    status: 200,
    data: formattedData,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
