import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeLogRemoteRepository } from '@/src/data/change-log/repository/change_log_remote_repository';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ChangeLogRemoteRepository', () => {
  let repository: ChangeLogRemoteRepository;
  const mockLog = {
    id: 'log-1',
    action: 'CREATE' as const,
    entity_type: 'project' as const,
    entity_id: 'p1',
    project_id: 'p1',
    user_id: 'u1',
    operator: 'Admin',
    description: 'Created project',
    before_state: null,
    after_state: null,
    metadata: null,
    created_at: '',
  };

  beforeEach(() => {
    repository = new ChangeLogRemoteRepository();
    vi.restoreAllMocks();
  });

  it('getChangeLogs should construct URL with query parameters and return changeLogs', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({
      success: true,
      changeLogs: [mockLog],
      totalCount: 1,
    });

    const result = await repository.getChangeLogs({
      limit: 15,
      offset: 0,
      search: 'test',
      action: 'CREATE',
      projectId: 'p1',
    });

    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      '/api/change-logs?limit=15&offset=0&search=test&action=CREATE&projectId=p1'
    );
    expect(result).toEqual({ changeLogs: [mockLog], totalCount: 1 });
  });

  it('getChangeLogs should throw error if response success is false', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({
      success: false,
      error: 'Unauthorized access',
    });

    await expect(
      repository.getChangeLogs({ limit: 10, offset: 0 })
    ).rejects.toThrow('Unauthorized access');
  });
});
