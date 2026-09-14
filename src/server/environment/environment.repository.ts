import prisma from '@/src/core/db/prisma-client';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { toEnvironmentDomain } from './environment.mapper';

export async function getEnvironmentsByProjectId(projectId: string): Promise<Environment[]> {
  const rows = await prisma.environment.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toEnvironmentDomain);
}

export async function getAllEnvironments(): Promise<Environment[]> {
  const rows = await prisma.environment.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toEnvironmentDomain);
}

export async function getEnvironmentById(id: string): Promise<Environment | null> {
  const row = await prisma.environment.findUnique({
    where: { id },
  });
  return row ? toEnvironmentDomain(row) : null;
}

export async function createEnvironment(
  input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<Environment> {
  const row = await prisma.environment.create({
    data: {
      id: input.id,
      projectId: input.projectId,
      name: input.name,
      environmentType: input.environmentType,
      publicBaseUrl: input.publicBaseUrl ?? null,
      originBaseUrl: input.originBaseUrl ?? null,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toEnvironmentDomain(row);
}

export async function updateEnvironment(id: string, input: Partial<Environment>): Promise<Environment> {
  const current = await getEnvironmentById(id);
  if (!current) throw new Error(`Environment ${id} not found`);

  const updatedRow = await prisma.environment.update({
    where: { id },
    data: {
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.environmentType !== undefined && { environmentType: input.environmentType }),
      ...(input.publicBaseUrl !== undefined && { publicBaseUrl: input.publicBaseUrl ?? null }),
      ...(input.originBaseUrl !== undefined && { originBaseUrl: input.originBaseUrl ?? null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
      ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
      ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
    },
  });
  return toEnvironmentDomain(updatedRow);
}

export async function softDeleteEnvironment(id: string): Promise<void> {
  await updateEnvironment(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function removeEnvironmentsByProjectId(projectId: string): Promise<void> {
  await prisma.environment.deleteMany({
    where: { projectId },
  });
}
