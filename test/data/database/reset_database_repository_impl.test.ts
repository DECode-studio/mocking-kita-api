import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetDatabaseRepositoryImpl } from '@/src/data/database/admin/reset_database_repository_impl';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('ResetDatabaseRepositoryImpl', () => {
  let repository: ResetDatabaseRepositoryImpl;

  beforeEach(() => {
    repository = new ResetDatabaseRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('resetDatabase should call callDatabase procedure resetDatabase', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(undefined);

    await repository.resetDatabase();

    expect(dbClient.callDatabase).toHaveBeenCalledWith('resetDatabase');
  });
});
