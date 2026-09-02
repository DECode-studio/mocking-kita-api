import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseSnapshotRepositoryImpl } from '@/src/data/database/snapshot/database_snapshot_repository_impl';
import * as dbClient from '@/src/core/http-client/database-proxy-client';

describe('DatabaseSnapshotRepositoryImpl', () => {
  let repository: DatabaseSnapshotRepositoryImpl;
  const mockDb = { version: '1.0.0', projects: [], environments: [], collections: [], apiCollections: [], apiEnvironments: [], requestScenarios: [], responseScenarios: [] };

  beforeEach(() => {
    repository = new DatabaseSnapshotRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getDatabase and importDatabase should call callDatabase with procedure', async () => {
    vi.spyOn(dbClient, 'callDatabase').mockResolvedValue(mockDb);

    const db = await repository.getDatabase();
    expect(dbClient.callDatabase).toHaveBeenCalledWith('getDatabase');
    expect(db).toEqual(mockDb);

    const imported = await repository.importDatabase(mockDb as any, 'replace');
    expect(dbClient.callDatabase).toHaveBeenCalledWith('importDatabase', { data: mockDb, mode: 'replace' });
    expect(imported).toEqual(mockDb);
  });
});
