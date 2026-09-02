import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  softDeleteProject,
  restoreProject,
  hardDeleteProject,
} from '@/src/data/project/data_source/project_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('project_data_source_impl', () => {
  const now = new Date();
  const mockProjectRow = {
    id: 'p1',
    name: 'Mock Studio',
    description: 'API Studio',
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllProjects should return formatted project domain models', async () => {
    (prisma.project.findMany as any).mockResolvedValue([mockProjectRow]);

    const result = await getAllProjects();

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].name).toBe('Mock Studio');
  });

  it('getProjectById should return single project or null', async () => {
    (prisma.project.findUnique as any).mockResolvedValue(mockProjectRow);

    const result = await getProjectById('p1');
    expect(result?.id).toBe('p1');

    (prisma.project.findUnique as any).mockResolvedValue(null);
    const nullRes = await getProjectById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createProject and updateProject should map to prisma calls', async () => {
    (prisma.project.create as any).mockResolvedValue(mockProjectRow);
    (prisma.project.findUnique as any).mockResolvedValue(mockProjectRow);
    (prisma.project.update as any).mockResolvedValue({ ...mockProjectRow, name: 'Updated Studio' });

    const created = await createProject({
      id: 'p1',
      name: 'Mock Studio',
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(created.id).toBe('p1');

    const updated = await updateProject('p1', { name: 'Updated Studio' });
    expect(updated.name).toBe('Updated Studio');
  });

  it('softDeleteProject, restoreProject, hardDeleteProject should execute prisma updates/deletes', async () => {
    (prisma.project.findUnique as any).mockResolvedValue(mockProjectRow);
    (prisma.project.update as any).mockResolvedValue(mockProjectRow);
    (prisma.project.delete as any).mockResolvedValue(mockProjectRow);

    await softDeleteProject('p1');
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ status: false }),
    });

    await restoreProject('p1');
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ status: true, deletedAt: null }),
    });

    await hardDeleteProject('p1');
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });
});
