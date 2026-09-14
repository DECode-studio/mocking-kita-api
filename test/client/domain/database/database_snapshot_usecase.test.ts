import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseSnapshotUseCaseImpl } from '@/src/client/domain/database/usecase/database_snapshot_usecase_impl';
import { DatabaseSnapshotRepository } from '@/src/client/domain/database/repository/database_snapshot_repository';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

describe('DatabaseSnapshotUseCaseImpl', () => {
  let repository: Partial<DatabaseSnapshotRepository>;
  let useCase: DatabaseSnapshotUseCaseImpl;

  const mockDb: MockApiDatabase = {
    version: '1.0.0',
    projects: [],
    environments: [],
    collections: [],
    apiCollections: [],
    apiEnvironments: [],
    requestScenarios: [],
    responseScenarios: [],
  };

  beforeEach(() => {
    repository = {
      getDatabase: vi.fn(),
      importDatabase: vi.fn(),
    };
    useCase = new DatabaseSnapshotUseCaseImpl(repository as DatabaseSnapshotRepository);
  });

  it('should delegate getDatabase to repository', async () => {
    (repository.getDatabase as any).mockResolvedValue(mockDb);

    const result = await useCase.getDatabase();

    expect(repository.getDatabase).toHaveBeenCalled();
    expect(result).toEqual(mockDb);
  });

  it('should delegate importDatabase to repository with mode', async () => {
    (repository.importDatabase as any).mockResolvedValue(mockDb);

    const result = await useCase.importDatabase(mockDb, 'replace');

    expect(repository.importDatabase).toHaveBeenCalledWith(mockDb, 'replace');
    expect(result).toEqual(mockDb);
  });
});
