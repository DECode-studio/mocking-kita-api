import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('ResponseScenarioRemoteRepository', () => {
  let repository: ResponseScenarioRemoteRepository;
  const mockResp = { id: 'res-1', requestScenarioId: 'req-1', name: '200 OK', statusCode: 200, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true };

  beforeEach(() => {
    repository = new ResponseScenarioRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByRequestScenarioId and getById should call getDatabase and filter', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ responseScenarios: [mockResp] });

    const list = await repository.getByRequestScenarioId('req-1');
    expect(list).toEqual([mockResp]);

    const item = await repository.getById('res-1');
    expect(item).toEqual(mockResp);

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
  });

  it('create, update, and softDelete should call callDatabase procedure', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockResp);

    await repository.create(mockResp as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('createRespScenario', mockResp);

    await repository.update('res-1', { name: 'Updated' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('updateRespScenario', { id: 'res-1', input: { name: 'Updated' } });

    await repository.softDelete('res-1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDeleteRespScenario', { id: 'res-1' });
  });

  it('uploadFile should send FormData to /api/upload and return file details', async () => {
    const mockFile = new File(['content'], 'test.json', { type: 'application/json' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, filePath: '/uploads/test.json', fileName: 'test.json' }),
    } as any);

    const res = await repository.uploadFile(mockFile);

    expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
    expect(res).toEqual({ filePath: '/uploads/test.json', fileName: 'test.json' });
  });

  it('uploadFile should throw error if upload fails', async () => {
    const mockFile = new File(['content'], 'test.json', { type: 'application/json' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Server error'),
    } as any);

    await expect(repository.uploadFile(mockFile)).rejects.toThrow('Server error');
  });
});
