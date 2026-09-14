import { DatabaseResetRepository } from '../repository/database_reset_repository';
import { DatabaseResetUseCase } from './database_reset_usecase';

export class DatabaseResetUseCaseImpl implements DatabaseResetUseCase {
  constructor(private readonly databaseResetRepository: DatabaseResetRepository) {}

  resetDatabase(): Promise<void> {
    return this.databaseResetRepository.resetDatabase();
  }
}
