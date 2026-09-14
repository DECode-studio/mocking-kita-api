import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseSnapshotRepositoryImpl } from '@/src/client/data/database/repository/database_snapshot_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('DatabaseSnapshotRepositoryImpl', () => {
  let repository: DatabaseSnapshotRepositoryImpl;
  const mockDb = { version: '1.0.0', projects: [], environments: [], collections: [], apiCollections: [], apiEnvironments: [], requestScenarios: [], responseScenarios: [] };

  beforeEach(() => {
    repository = new DatabaseSnapshotRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getDatabase and importDatabase should call snapshot API endpoints', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: mockDb });

    const db = await repository.getDatabase();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/database');
    expect(db).toEqual(mockDb);

    const imported = await repository.importDatabase(mockDb as any, 'replace');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/database', { method: 'POST', body: { action: 'importDatabase', payload: { data: mockDb, mode: 'replace' } } });
    expect(imported).toEqual(mockDb);
  });
});
