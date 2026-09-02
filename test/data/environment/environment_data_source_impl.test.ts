import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEnvironmentsByProjectId,
  getEnvironmentById,
  createEnvironment,
  updateEnvironment,
  softDeleteEnvironment,
  removeEnvironmentsByProjectId,
} from '@/src/data/environment/data_source/environment_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    environment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('environment_data_source_impl', () => {
  const now = new Date();
  const mockEnvRow = {
    id: 'env-1',
    projectId: 'proj-1',
    name: 'Development',
    environmentType: 'DEVELOPMENT',
    publicBaseUrl: 'http://localhost:3000',
    originBaseUrl: 'http://localhost:8080',
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getEnvironmentsByProjectId should fetch environments by project id', async () => {
    (prisma.environment.findMany as any).mockResolvedValue([mockEnvRow]);

    const result = await getEnvironmentsByProjectId('proj-1');

    expect(prisma.environment.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].name).toBe('Development');
  });

  it('getEnvironmentById should return environment or null', async () => {
    (prisma.environment.findUnique as any).mockResolvedValue(mockEnvRow);

    const result = await getEnvironmentById('env-1');
    expect(result?.id).toBe('env-1');

    (prisma.environment.findUnique as any).mockResolvedValue(null);
    const nullRes = await getEnvironmentById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createEnvironment and updateEnvironment should handle updates and soft delete', async () => {
    (prisma.environment.create as any).mockResolvedValue(mockEnvRow);
    (prisma.environment.findUnique as any).mockResolvedValue(mockEnvRow);
    (prisma.environment.update as any).mockResolvedValue({ ...mockEnvRow, name: 'Staging' });

    const created = await createEnvironment({
      id: 'env-1',
      projectId: 'proj-1',
      name: 'Development',
      environmentType: 'DEVELOPMENT' as const,
      publicBaseUrl: 'http://localhost:3000',
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(created.id).toBe('env-1');

    const updated = await updateEnvironment('env-1', { name: 'Staging' });
    expect(updated.name).toBe('Staging');

    await softDeleteEnvironment('env-1');
    expect(prisma.environment.update).toHaveBeenCalledWith({
      where: { id: 'env-1' },
      data: expect.objectContaining({ status: false }),
    });
  });

  it('removeEnvironmentsByProjectId should call deleteMany', async () => {
    (prisma.environment.deleteMany as any).mockResolvedValue({ count: 1 });

    await removeEnvironmentsByProjectId('proj-1');

    expect(prisma.environment.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
  });
});
