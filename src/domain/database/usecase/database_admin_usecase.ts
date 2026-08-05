import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DatabaseAdminRepository } from '../repository/database_admin_repository';

export interface DatabaseAdminUseCase {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}

export class DatabaseAdminUseCaseImpl implements DatabaseAdminUseCase {
  constructor(private readonly databaseRepository: DatabaseAdminRepository) {}

  getDatabase(): Promise<MockApiDatabase> {
    return this.databaseRepository.getDatabase();
  }

  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return this.databaseRepository.importDatabase(data, mode);
  }
}
