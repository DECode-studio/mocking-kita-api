import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCollectionsByProjectId,
  getCollectionById,
  createCollection,
  updateCollection,
  softDeleteCollection,
  removeCollectionsByProjectId,
} from '@/src/data/collection/data_source/collection_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    collection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    api: {
      updateMany: vi.fn(),
    },
  },
}));

describe('collection_data_source_impl', () => {
  const now = new Date();
  const mockCollectionRow = {
    id: 'col-1',
    projectId: 'proj-1',
    name: 'Auth Collection',
    description: 'Endpoints for auth',
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCollectionsByProjectId should fetch collections by project id', async () => {
    (prisma.collection.findMany as any).mockResolvedValue([mockCollectionRow]);

    const result = await getCollectionsByProjectId('proj-1');

    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].name).toBe('Auth Collection');
  });

  it('getCollectionById should return collection or null', async () => {
    (prisma.collection.findUnique as any).mockResolvedValue(mockCollectionRow);

    const result = await getCollectionById('col-1');
    expect(result?.id).toBe('col-1');

    (prisma.collection.findUnique as any).mockResolvedValue(null);
    const nullRes = await getCollectionById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createCollection should map inputs to prisma create', async () => {
    (prisma.collection.create as any).mockResolvedValue(mockCollectionRow);

    const input = {
      id: 'col-1',
      projectId: 'proj-1',
      name: 'Auth Collection',
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const created = await createCollection(input);
    expect(prisma.collection.create).toHaveBeenCalled();
    expect(created.id).toBe('col-1');
  });

  it('updateCollection and softDeleteCollection should handle updates and API collection resets', async () => {
    (prisma.collection.findUnique as any).mockResolvedValue(mockCollectionRow);
    (prisma.collection.update as any).mockResolvedValue({ ...mockCollectionRow, name: 'Updated Auth' });
    (prisma.api.updateMany as any).mockResolvedValue({ count: 1 });

    const updated = await updateCollection('col-1', { name: 'Updated Auth' });
    expect(updated.name).toBe('Updated Auth');

    await softDeleteCollection('col-1');
    expect(prisma.api.updateMany).toHaveBeenCalledWith({
      where: { collectionId: 'col-1' },
      data: { collectionId: null },
    });
  });

  it('removeCollectionsByProjectId should call deleteMany', async () => {
    (prisma.collection.deleteMany as any).mockResolvedValue({ count: 1 });

    await removeCollectionsByProjectId('proj-1');

    expect(prisma.collection.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
  });
});
