import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseResetUseCaseImpl } from '@/src/domain/database/usecase/database_reset_usecase';
import { DatabaseResetRepository } from '@/src/domain/database/repository/database_reset_repository';

describe('DatabaseResetUseCaseImpl', () => {
  let repository: Partial<DatabaseResetRepository>;
  let useCase: DatabaseResetUseCaseImpl;

  beforeEach(() => {
    repository = {
      resetDatabase: vi.fn(),
    };
    useCase = new DatabaseResetUseCaseImpl(repository as DatabaseResetRepository);
  });

  it('should delegate resetDatabase to repository', async () => {
    (repository.resetDatabase as any).mockResolvedValue(undefined);

    await useCase.resetDatabase();

    expect(repository.resetDatabase).toHaveBeenCalled();
  });
});
