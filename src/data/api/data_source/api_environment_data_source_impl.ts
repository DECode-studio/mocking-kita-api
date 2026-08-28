import prisma from '@/src/core/db/prisma-client';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';

function toApiEnvironmentDomain(row: {
  id: string;
  apiId: string;
  environmentId: string;
  enabled: boolean;
  pathOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiEnvironment {
  return {
    id: row.id,
    apiId: row.apiId,
    environmentId: row.environmentId,
    enabled: row.enabled,
    pathOverride: row.pathOverride ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getApiEnvironmentsByApiId(apiId: string): Promise<ApiEnvironment[]> {
  const rows = await prisma.apiEnvironment.findMany({
    where: { apiId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toApiEnvironmentDomain);
}

export async function getApiEnvironment(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
  const row = await prisma.apiEnvironment.findUnique({
    where: {
      tblApiEnvironment_index_1: {
        apiId,
        environmentId,
      },
    },
  });
  return row ? toApiEnvironmentDomain(row) : null;
}

export async function upsertApiEnvironment(
  input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ApiEnvironment> {
  const row = await prisma.apiEnvironment.upsert({
    where: {
      tblApiEnvironment_index_1: {
        apiId: input.apiId,
        environmentId: input.environmentId,
      },
    },
    update: {
      enabled: input.enabled,
      pathOverride: input.pathOverride ?? null,
      updatedAt: new Date(),
    },
    create: {
      id: input.id || `apienv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apiId: input.apiId,
      environmentId: input.environmentId,
      enabled: input.enabled,
      pathOverride: input.pathOverride ?? null,
    },
  });

  return toApiEnvironmentDomain(row);
}

export async function removeApiEnvironmentsByApiId(apiId: string): Promise<void> {
  await prisma.apiEnvironment.deleteMany({
    where: { apiId },
  });
}

export async function removeApiEnvironmentsByEnvironmentId(environmentId: string): Promise<void> {
  await prisma.apiEnvironment.deleteMany({
    where: { environmentId },
  });
}
