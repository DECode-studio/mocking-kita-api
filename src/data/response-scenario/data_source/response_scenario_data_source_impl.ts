import prisma from '@/src/core/db/prisma-client';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { Prisma } from '@prisma/client';

function toResponseScenarioDomain(r: {
  id: string;
  requestScenarioId: string;
  name: string;
  description: string | null;
  statusCode: number | null;
  headers: any;
  body: any;
  responseType: string;
  filePath: string | null;
  fileName: string | null;
  delayMs: number;
  weight: number;
  priority: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ResponseScenario {
  return {
    id: r.id,
    requestScenarioId: r.requestScenarioId,
    name: r.name,
    description: r.description ?? undefined,
    statusCode: r.statusCode ?? 200,
    headers: r.headers ?? {},
    body: r.body ?? {},
    responseType: r.responseType as any,
    filePath: r.filePath ?? undefined,
    fileName: r.fileName ?? undefined,
    delayMs: r.delayMs,
    weight: r.weight,
    priority: r.priority,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}

export async function getResponseScenariosByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
  const rows = await prisma.responseScenario.findMany({
    where: { requestScenarioId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toResponseScenarioDomain);
}

export async function getResponseScenarioById(id: string): Promise<ResponseScenario | null> {
  const row = await prisma.responseScenario.findUnique({
    where: { id },
  });
  return row ? toResponseScenarioDomain(row) : null;
}

export async function createResponseScenario(
  input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<ResponseScenario> {
  const row = await prisma.responseScenario.create({
    data: {
      id: input.id,
      requestScenarioId: input.requestScenarioId,
      name: input.name,
      description: input.description ?? null,
      statusCode: input.statusCode,
      headers: (input.headers as Prisma.InputJsonValue) ?? {},
      body: (input.body as Prisma.InputJsonValue) ?? {},
      responseType: input.responseType ?? 'JSON',
      filePath: input.filePath ?? null,
      fileName: input.fileName ?? null,
      delayMs: input.delayMs ?? 0,
      weight: input.weight ?? 100,
      priority: input.priority ?? 0,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toResponseScenarioDomain(row);
}

export async function updateResponseScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
  const current = await getResponseScenarioById(id);
  if (!current) throw new Error(`Response scenario ${id} not found`);

  const updateData: Prisma.ResponseScenarioUncheckedUpdateInput = {
    ...(input.requestScenarioId !== undefined && { requestScenarioId: input.requestScenarioId }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description ?? null }),
    ...(input.statusCode !== undefined && { statusCode: input.statusCode }),
    ...(input.headers !== undefined && { headers: (input.headers as Prisma.InputJsonValue) ?? {} }),
    ...(input.body !== undefined && { body: (input.body as Prisma.InputJsonValue) ?? {} }),
    ...(input.responseType !== undefined && { responseType: input.responseType }),
    ...(input.filePath !== undefined && { filePath: input.filePath ?? null }),
    ...(input.fileName !== undefined && { fileName: input.fileName ?? null }),
    ...(input.delayMs !== undefined && { delayMs: input.delayMs }),
    ...(input.weight !== undefined && { weight: input.weight }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
    ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
    ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
  };

  const updatedRow = await prisma.responseScenario.update({
    where: { id },
    data: updateData,
  });
  return toResponseScenarioDomain(updatedRow);
}

export async function softDeleteResponseScenario(id: string): Promise<void> {
  await updateResponseScenario(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function removeResponseScenariosByRequestScenarioId(requestScenarioId: string): Promise<void> {
  await prisma.responseScenario.deleteMany({
    where: { requestScenarioId },
  });
}
