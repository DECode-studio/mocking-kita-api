import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('RequestScenarioRemoteRepository', () => {
  let repository: RequestScenarioRemoteRepository;
  const mockReq = { id: 'req-1', apiId: 'api-1', name: 'Req 1', priority: 10, status: true };

  beforeEach(() => {
    repository = new RequestScenarioRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getByApiId and getById should call getDatabase and filter', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue({ requestScenarios: [mockReq] });

    const list = await repository.getByApiId('api-1');
    expect(list).toEqual([mockReq]);

    const item = await repository.getById('req-1');
    expect(item).toEqual(mockReq);

    const nullItem = await repository.getById('invalid');
    expect(nullItem).toBeNull();
  });

  it('create, update, and softDelete should call callDatabase procedure', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockReq);

    await repository.create(mockReq as any);
    expect(dbClient.callDatabase).toHaveBeenCalledWith('createReqScenario', mockReq);

    await repository.update('req-1', { name: 'Updated' });
    expect(dbClient.callDatabase).toHaveBeenCalledWith('updateReqScenario', { id: 'req-1', input: { name: 'Updated' } });

    await repository.softDelete('req-1');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('softDeleteReqScenario', { id: 'req-1' });
  });
});
