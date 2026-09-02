import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getResponseScenariosByRequestScenarioId,
  getResponseScenarioById,
  createResponseScenario,
  updateResponseScenario,
  softDeleteResponseScenario,
  removeResponseScenariosByRequestScenarioId,
} from '@/src/data/response-scenario/data_source/response_scenario_data_source_impl';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    responseScenario: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('response_scenario_data_source_impl', () => {
  const now = new Date();
  const mockRespRow = {
    id: 'res-1',
    requestScenarioId: 'req-1',
    name: '200 Success',
    description: 'Success response',
    statusCode: 200,
    headers: {},
    body: {},
    responseType: 'JSON',
    filePath: null,
    fileName: null,
    delayMs: 0,
    weight: 100,
    priority: 10,
    status: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getResponseScenariosByRequestScenarioId should fetch scenarios', async () => {
    (prisma.responseScenario.findMany as any).mockResolvedValue([mockRespRow]);

    const result = await getResponseScenariosByRequestScenarioId('req-1');

    expect(prisma.responseScenario.findMany).toHaveBeenCalledWith({
      where: { requestScenarioId: 'req-1' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result[0].name).toBe('200 Success');
  });

  it('getResponseScenarioById should return scenario or null', async () => {
    (prisma.responseScenario.findUnique as any).mockResolvedValue(mockRespRow);

    const result = await getResponseScenarioById('res-1');
    expect(result?.id).toBe('res-1');

    (prisma.responseScenario.findUnique as any).mockResolvedValue(null);
    const nullRes = await getResponseScenarioById('invalid');
    expect(nullRes).toBeNull();
  });

  it('createResponseScenario and updateResponseScenario should map to prisma calls', async () => {
    (prisma.responseScenario.create as any).mockResolvedValue(mockRespRow);
    (prisma.responseScenario.findUnique as any).mockResolvedValue(mockRespRow);
    (prisma.responseScenario.update as any).mockResolvedValue({ ...mockRespRow, name: 'Updated Resp' });

    const created = await createResponseScenario({
      id: 'res-1',
      requestScenarioId: 'req-1',
      name: '200 Success',
      statusCode: 200,
      headers: {},
      body: {},
      responseType: 'JSON' as const,
      delayMs: 0,
      weight: 100,
      priority: 10,
      status: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(created.id).toBe('res-1');

    const updated = await updateResponseScenario('res-1', { name: 'Updated Resp' });
    expect(updated.name).toBe('Updated Resp');

    await softDeleteResponseScenario('res-1');
    expect(prisma.responseScenario.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({ status: false }),
    });
  });

  it('removeResponseScenariosByRequestScenarioId should call deleteMany', async () => {
    (prisma.responseScenario.deleteMany as any).mockResolvedValue({ count: 1 });

    await removeResponseScenariosByRequestScenarioId('req-1');

    expect(prisma.responseScenario.deleteMany).toHaveBeenCalledWith({ where: { requestScenarioId: 'req-1' } });
  });
});
