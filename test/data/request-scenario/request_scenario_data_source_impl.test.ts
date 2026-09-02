import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRequestScenariosByApiId,
  getRequestScenarioById,
  createRequestScenario,
  updateRequestScenario,
  softDeleteRequestScenario,
  removeRequestScenariosByApiId,
} from '@/src/data/request-scenario/data_source/request_scenario_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    requestScenario: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('request_scenario_data_source_impl', () => {
  const now = new Date();
  const mockReqRow = {
    id: 'req-1',
    apiId: 'api-1',
    name: 'Default Request',
    description: 'Req scenario',
    headers: {},
    queryParams: {},
    pathParams: {},
    body: {},
    bodyType: 'JSON',
    matchType: 'EXACT',
    priority: 10,
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRequestScenariosByApiId should fetch scenarios by apiId', async () => {
    (prisma.requestScenario.findMany as any).mockResolvedValue([mockReqRow]);

    const result = await getRequestScenariosByApiId('api-1');

    expect(prisma.requestScenario.findMany).toHaveBeenCalledWith({
      where: { apiId: 'api-1' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].name).toBe('Default Request');
  });

  it('getRequestScenarioById should return scenario or null', async () => {
    (prisma.requestScenario.findUnique as any).mockResolvedValue(mockReqRow);

    const result = await getRequestScenarioById('req-1');
    expect(result?.id).toBe('req-1');

    (prisma.requestScenario.findUnique as any).mockResolvedValue(null);
    const nullRes = await getRequestScenarioById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createRequestScenario and updateRequestScenario should update prisma data', async () => {
    (prisma.requestScenario.create as any).mockResolvedValue(mockReqRow);
    (prisma.requestScenario.findUnique as any).mockResolvedValue(mockReqRow);
    (prisma.requestScenario.update as any).mockResolvedValue({ ...mockReqRow, name: 'Updated Req' });

    const created = await createRequestScenario({
      id: 'req-1',
      apiId: 'api-1',
      name: 'Default Request',
      headers: {},
      queryParams: {},
      pathParams: {},
      body: {},
      bodyType: 'JSON' as const,
      matchType: 'EXACT' as const,
      priority: 10,
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(created.id).toBe('req-1');

    const updated = await updateRequestScenario('req-1', { name: 'Updated Req' });
    expect(updated.name).toBe('Updated Req');

    await softDeleteRequestScenario('req-1');
    expect(prisma.requestScenario.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: false }),
    });
  });

  it('removeRequestScenariosByApiId should call deleteMany', async () => {
    (prisma.requestScenario.deleteMany as any).mockResolvedValue({ count: 1 });

    await removeRequestScenariosByApiId('api-1');

    expect(prisma.requestScenario.deleteMany).toHaveBeenCalledWith({ where: { apiId: 'api-1' } });
  });
});
