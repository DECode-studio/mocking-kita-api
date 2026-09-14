import prisma from '@/src/core/db/prisma-client';
import { Project } from '@/src/client/domain/project/entity/project';
import { toProjectDomain } from './project.mapper';

export async function getAllProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    include: { pics: { include: { account: true } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toProjectDomain);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({
    where: { id },
    include: { pics: { include: { account: true } } },
  });
  return row ? toProjectDomain(row) : null;
}

export async function createProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Promise<Project> {
  const picIds = (input.picIds || []).filter(Boolean);
  const row = await prisma.project.create({
    data: {
      id: input.id,
      name: input.name,
      description: input.description ?? null,
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
  return toProjectDomain(row);
}

export async function updateProject(id: string, input: Partial<Project>): Promise<Project> {
  const current = await getProjectById(id);
  if (!current) throw new Error(`Project ${id} not found`);

  if (input.picIds !== undefined) {
    await prisma.projectPic.deleteMany({ where: { projectId: id } });
    const picIds = (input.picIds || []).filter(Boolean);
    if (picIds.length > 0) {
      await prisma.projectPic.createMany({
        data: picIds.map((accountId) => ({ projectId: id, accountId })),
      });
    }
  }

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
    include: { pics: { include: { account: true } } },
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
  await prisma.project.delete({
    where: { id },
  });
}
