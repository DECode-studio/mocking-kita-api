import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseResetRepositoryImpl } from '@/src/client/data/database/repository/database_reset_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('DatabaseResetRepositoryImpl', () => {
  let repository: DatabaseResetRepositoryImpl;

  beforeEach(() => {
    repository = new DatabaseResetRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('resetDatabase should call snapshot reset endpoint', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true });

    await repository.resetDatabase();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/database', { method: 'POST', body: { action: 'resetDatabase' } });
  });
});
