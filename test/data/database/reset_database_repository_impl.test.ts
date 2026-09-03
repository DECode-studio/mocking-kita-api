import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetDatabaseRepositoryImpl } from '@/src/data/database/admin/reset_database_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('ResetDatabaseRepositoryImpl', () => {
  let repository: ResetDatabaseRepositoryImpl;

  beforeEach(() => {
    repository = new ResetDatabaseRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('resetDatabase should call snapshot reset endpoint', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true });

    await repository.resetDatabase();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/database', { method: 'POST', body: { action: 'resetDatabase' } });
  });
});
