import prisma from '@/src/core/db/prisma-client';
import { Project } from '@/src/domain/project/entity/project';

function toProjectDomain(p: {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Project {
  return {
    id: p.id,
    name: p.name ?? '',
    description: p.description ?? undefined,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toProjectDomain);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({
    where: { id },
  });
  return row ? toProjectDomain(row) : null;
}

export async function createProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<Project> {
  const row = await prisma.project.create({
    data: {
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
      deletedAt: input.deletedAt ? new Date(input.deletedAt) : null,
    },
  });
  return toProjectDomain(row);
}

export async function updateProject(id: string, input: Partial<Project>): Promise<Project> {
  const current = await getProjectById(id);
  if (!current) throw new Error(`Project ${id} not found`);

  const updatedRow = await prisma.project.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.createdAt !== undefined && { createdAt: new Date(input.createdAt) }),
      ...(input.updatedAt !== undefined ? { updatedAt: new Date(input.updatedAt) } : { updatedAt: new Date() }),
      ...(input.deletedAt !== undefined && { deletedAt: input.deletedAt ? new Date(input.deletedAt) : null }),
    },
  });
  return toProjectDomain(updatedRow);
}

export async function softDeleteProject(id: string): Promise<void> {
  await updateProject(id, { deletedAt: new Date().toISOString(), status: false });
}

export async function restoreProject(id: string): Promise<void> {
  await updateProject(id, { deletedAt: null, status: true });
}

export async function hardDeleteProject(id: string): Promise<void> {
  // Cascading deletes are configured in Prisma schema (onDelete: Cascade)
  await prisma.project.delete({
    where: { id },
  });
}
