import prisma from '@/src/core/db/prisma-client';
import {
  Environment,
  EnvironmentVariable,
  normalizeEnvironmentValues,
} from '@/src/client/domain/environment/entity/environment';
import { generateId } from '@/src/core/utils/uuid';
import { toEnvironmentDomain } from './environment.mapper';

function normalizeVariables(
  variables?: EnvironmentVariable[] | null,
  legacyBaseUrl?: string | null
): EnvironmentVariable[] {
  let list: EnvironmentVariable[] = Array.isArray(variables) ? [...variables] : [];

  if (legacyBaseUrl && legacyBaseUrl.trim()) {
    const hasBaseUrl = list.some(
      (v) => v.key === 'baseUrl' || v.key.toLowerCase() === 'base_url'
    );
    if (!hasBaseUrl) {
      list.push({
        id: generateId(),
        key: 'baseUrl',
        value: legacyBaseUrl.trim(),
        type: 'plain',
        enabled: true,
      });
    }
  }

  return list;
}

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
  input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt: string;
    updatedAt: string;
    baseUrl?: string;
  }
): Promise<Environment> {
  const isBaseUrl = input.isBaseUrl !== false;
  let finalValues = normalizeEnvironmentValues(input.values, isBaseUrl);

  // If input.baseUrl is provided and values has no entry, seed into appropriate stage
  if (input.baseUrl && Object.values(finalValues).every((v) => !v)) {
    const targetStage = input.environmentType || 'DEVELOPMENT';
    if (!isBaseUrl || targetStage !== 'LOCAL') {
      finalValues[targetStage] = input.baseUrl.trim();
    }
  }

  const finalVariables = normalizeVariables(input.variables, input.baseUrl);

  const row = await prisma.environment.create({
    data: {
      id: input.id,
      projectId: input.projectId,
      name: input.name,
      isBaseUrl,
      values: finalValues as any,
      environmentType: input.environmentType || null,
      variables: finalVariables as any,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toEnvironmentDomain(row);
}

export async function updateEnvironment(
  id: string,
  input: Partial<Environment> & { baseUrl?: string }
): Promise<Environment> {
  const current = await getEnvironmentById(id);
  if (!current) throw new Error(`Environment ${id} not found`);

  const effectiveIsBaseUrl = input.isBaseUrl !== undefined ? input.isBaseUrl : current.isBaseUrl;

  let finalValues = current.values;
  if (input.values !== undefined) {
    finalValues = normalizeEnvironmentValues(input.values, effectiveIsBaseUrl);
  } else if (input.isBaseUrl !== undefined && input.isBaseUrl !== current.isBaseUrl) {
    finalValues = normalizeEnvironmentValues(current.values, effectiveIsBaseUrl);
  }

  let finalVariables: EnvironmentVariable[] | undefined = undefined;
  if (input.variables !== undefined) {
    finalVariables = normalizeVariables(input.variables, input.baseUrl);
  } else if (input.baseUrl !== undefined) {
    finalVariables = normalizeVariables(current.variables, input.baseUrl);
  }

  const updatedRow = await prisma.environment.update({
    where: { id },
    data: {
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.isBaseUrl !== undefined && { isBaseUrl: input.isBaseUrl }),
      ...(input.values !== undefined || input.isBaseUrl !== undefined
        ? { values: finalValues as any }
        : {}),
      ...(input.environmentType !== undefined && { environmentType: input.environmentType || null }),
      ...(finalVariables !== undefined && { variables: finalVariables as any }),
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
