import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApisByProjectId,
  getApiById,
  createApi,
  updateApi,
  softDeleteApi,
  removeApisByProjectId,
} from '@/src/data/api/data_source/api_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    api: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('api_data_source_impl', () => {
  const now = new Date();
  const mockApiRow = {
    id: 'api-1',
    projectId: 'proj-1',
    collectionId: 'col-1',
    name: 'Get Users',
    description: 'Fetch all users',
    path: '/users',
    methodRequest: 'GET',
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getApisByProjectId should return formatted domain models', async () => {
    (prisma.api.findMany as any).mockResolvedValue([mockApiRow]);

    const result = await getApisByProjectId('proj-1');

    expect(prisma.api.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].id).toBe('api-1');
    expect(result[0].createdAt).toBe(now.toISOString());
  });

  it('getApiById should return single API or null', async () => {
    (prisma.api.findUnique as any).mockResolvedValue(mockApiRow);

    const result = await getApiById('api-1');
    expect(result?.name).toBe('Get Users');

    (prisma.api.findUnique as any).mockResolvedValue(null);
    const nullRes = await getApiById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createApi should map inputs to prisma create', async () => {
    (prisma.api.create as any).mockResolvedValue(mockApiRow);

    const input = {
      id: 'api-1',
      projectId: 'proj-1',
      name: 'Get Users',
      path: '/users',
      methodRequest: 'GET' as const,
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const created = await createApi(input);

    expect(prisma.api.create).toHaveBeenCalled();
    expect(created.id).toBe('api-1');
  });

  it('updateApi should throw error if API is not found', async () => {
    (prisma.api.findUnique as any).mockResolvedValue(null);

    await expect(updateApi('non-existent', { name: 'New Name' })).rejects.toThrow(
      'API Collection non-existent not found'
    );
  });

  it('updateApi and softDeleteApi should call prisma update', async () => {
    (prisma.api.findUnique as any).mockResolvedValue(mockApiRow);
    (prisma.api.update as any).mockResolvedValue({ ...mockApiRow, name: 'Updated Users' });

    const updated = await updateApi('api-1', { name: 'Updated Users' });
    expect(updated.name).toBe('Updated Users');

    await softDeleteApi('api-1');
    expect(prisma.api.update).toHaveBeenCalledWith({
      where: { id: 'api-1' },
      data: expect.objectContaining({ status: false }),
    });
  });

  it('removeApisByProjectId should call deleteMany', async () => {
    (prisma.api.deleteMany as any).mockResolvedValue({ count: 2 });

    await removeApisByProjectId('proj-1');

    expect(prisma.api.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
  });
});
