import prisma from '@/src/core/db/prisma-client';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { Prisma } from '@prisma/client';
import { toRequestScenarioDomain } from './request-scenario.mapper';

export async function getRequestScenariosByApiId(apiId: string): Promise<RequestScenario[]> {
  const rows = await prisma.requestScenario.findMany({
    where: { apiId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toRequestScenarioDomain);
}

export async function getRequestScenarioById(id: string): Promise<RequestScenario | null> {
  const row = await prisma.requestScenario.findUnique({
    where: { id },
  });
  return row ? toRequestScenarioDomain(row) : null;
}

export async function createRequestScenario(
  input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<RequestScenario> {
  const row = await prisma.requestScenario.create({
    data: {
      id: input.id,
      apiId: input.apiId,
      name: input.name,
      description: input.description ?? null,
      headers: (input.headers as Prisma.InputJsonValue) ?? {},
      queryParams: (input.queryParams as Prisma.InputJsonValue) ?? {},
      pathParams: (input.pathParams as Prisma.InputJsonValue) ?? {},
      body: (input.body as Prisma.InputJsonValue) ?? {},
      bodyType: input.bodyType ?? 'JSON',
      matchType: input.matchType ?? 'EXACT',
      priority: input.priority ?? 0,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toRequestScenarioDomain(row);
}

export async function updateRequestScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
  const current = await getRequestScenarioById(id);
  if (!current) throw new Error(`Request scenario ${id} not found`);

  const updateData: Prisma.RequestScenarioUncheckedUpdateInput = {
    ...(input.apiId !== undefined && { apiId: input.apiId }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description ?? null }),
    ...(input.headers !== undefined && { headers: (input.headers as Prisma.InputJsonValue) ?? {} }),
    ...(input.queryParams !== undefined && { queryParams: (input.queryParams as Prisma.InputJsonValue) ?? {} }),
    ...(input.pathParams !== undefined && { pathParams: (input.pathParams as Prisma.InputJsonValue) ?? {} }),
    ...(input.body !== undefined && { body: (input.body as Prisma.InputJsonValue) ?? {} }),
    ...(input.bodyType !== undefined && { bodyType: input.bodyType }),
    ...(input.matchType !== undefined && { matchType: input.matchType }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
    ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
    ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
  };

  const updatedRow = await prisma.requestScenario.update({
    where: { id },
    data: updateData,
  });
  return toRequestScenarioDomain(updatedRow);
}

export async function softDeleteRequestScenario(id: string): Promise<void> {
  await updateRequestScenario(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function removeRequestScenariosByApiId(apiId: string): Promise<void> {
  await prisma.requestScenario.deleteMany({
    where: { apiId },
  });
}
