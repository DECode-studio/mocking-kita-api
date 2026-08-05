import { DatabaseResetRepository } from '../repository/database_reset_repository';

export interface DatabaseResetUseCase {
  resetDatabase(): Promise<void>;
}

export class DatabaseResetUseCaseImpl implements DatabaseResetUseCase {
  constructor(private readonly databaseResetRepository: DatabaseResetRepository) {}

  resetDatabase(): Promise<void> {
    return this.databaseResetRepository.resetDatabase();
  }
}
