import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResponseScenarioRepositoryImpl } from '@/src/client/data/response-scenario/repository/response_scenario_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ResponseScenarioRepositoryImpl', () => {
  let repository: ResponseScenarioRepositoryImpl;
  const mockResp = { id: 'res-1', requestScenarioId: 'req-1', name: '200 OK', statusCode: 200, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true };

  beforeEach(() => {
    repository = new ResponseScenarioRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getByRequestScenarioId and getById should request only response scenario data needed', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: [mockResp] })
      .mockResolvedValueOnce({ success: true, data: mockResp })
      .mockResolvedValueOnce({ success: true, data: null });

    const list = await repository.getByRequestScenarioId('req-1');
    expect(list).toEqual([mockResp]);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios/req-1/response-scenarios');

    const item = await repository.getById('res-1');
    expect(item).toEqual(mockResp);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/response-scenarios/res-1');

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/response-scenarios/invalid');
  });

  it('create, update, and softDelete should call REST endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockResp });

    await repository.create(mockResp as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/response-scenarios', { method: 'POST', body: mockResp });

    await repository.update('res-1', { name: 'Updated' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/response-scenarios/res-1', { method: 'PUT', body: { name: 'Updated' } });

    await repository.softDelete('res-1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/response-scenarios/res-1', { method: 'DELETE' });
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
      json: vi.fn().mockResolvedValue({ success: false, error: 'Server error' }),
    } as any);

    await expect(repository.uploadFile(mockFile)).rejects.toThrow('Server error');
  });
});
