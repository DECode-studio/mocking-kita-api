import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import * as apiClient from '@/src/core/http-client/api-client';

describe('RequestScenarioRemoteRepository', () => {
  let repository: RequestScenarioRemoteRepository;
  const mockReq = { id: 'req-1', apiId: 'api-1', name: 'Req 1', priority: 10, status: true };

  beforeEach(() => {
    repository = new RequestScenarioRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByApiId and getById should request only request scenario data needed', async () => {
    vi.spyOn(apiClient, 'apiRequest')
      .mockResolvedValueOnce({ success: true, data: [mockReq] })
      .mockResolvedValueOnce({ success: true, data: mockReq })
      .mockResolvedValueOnce({ success: true, data: null });

    const list = await repository.getByApiId('api-1');
    expect(list).toEqual([mockReq]);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/apis/api-1/request-scenarios');

    const item = await repository.getById('req-1');
    expect(item).toEqual(mockReq);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios/req-1');

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios/invalid');
  });

  it('create, update, and softDelete should call REST endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockReq });

    await repository.create(mockReq as any);
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios', { method: 'POST', body: mockReq });

    await repository.update('req-1', { name: 'Updated' });
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios/req-1', { method: 'PUT', body: { name: 'Updated' } });

    await repository.softDelete('req-1');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/request-scenarios/req-1', { method: 'DELETE' });
  });
});
