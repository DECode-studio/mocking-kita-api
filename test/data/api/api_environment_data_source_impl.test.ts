import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApiEnvironmentsByApiId,
  getApiEnvironment,
  upsertApiEnvironment,
  removeApiEnvironmentsByApiId,
  removeApiEnvironmentsByEnvironmentId,
} from '@/src/data/api/data_source/api_environment_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    apiEnvironment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('api_environment_data_source_impl', () => {
  const now = new Date();
  const mockRow = {
    id: 'apienv-1',
    apiId: 'api-1',
    environmentId: 'env-1',
    enabled: true,
    pathOverride: '/override',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getApiEnvironmentsByApiId should fetch api environments', async () => {
    (prisma.apiEnvironment.findMany as any).mockResolvedValue([mockRow]);

    const result = await getApiEnvironmentsByApiId('api-1');

    expect(prisma.apiEnvironment.findMany).toHaveBeenCalledWith({
      where: { apiId: 'api-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].pathOverride).toBe('/override');
  });

  it('getApiEnvironment should return single item or null', async () => {
    (prisma.apiEnvironment.findUnique as any).mockResolvedValue(mockRow);

    const result = await getApiEnvironment('api-1', 'env-1');
    expect(result?.id).toBe('apienv-1');

    (prisma.apiEnvironment.findUnique as any).mockResolvedValue(null);
    const nullRes = await getApiEnvironment('api-1', 'non-existent');
    expect(nullRes).toBeNull();
  });

  it('upsertApiEnvironment should call prisma upsert', async () => {
    (prisma.apiEnvironment.upsert as any).mockResolvedValue(mockRow);

    const input = {
      apiId: 'api-1',
      environmentId: 'env-1',
      enabled: true,
      pathOverride: '/override',
    };

    const result = await upsertApiEnvironment(input);

    expect(prisma.apiEnvironment.upsert).toHaveBeenCalled();
    expect(result.id).toBe('apienv-1');
  });

  it('removeApiEnvironmentsByApiId and removeApiEnvironmentsByEnvironmentId should call deleteMany', async () => {
    (prisma.apiEnvironment.deleteMany as any).mockResolvedValue({ count: 1 });

    await removeApiEnvironmentsByApiId('api-1');
    expect(prisma.apiEnvironment.deleteMany).toHaveBeenCalledWith({ where: { apiId: 'api-1' } });

    await removeApiEnvironmentsByEnvironmentId('env-1');
    expect(prisma.apiEnvironment.deleteMany).toHaveBeenCalledWith({ where: { environmentId: 'env-1' } });
  });
});
