import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DatabaseSnapshotRepository } from '../repository/database_snapshot_repository';

export interface DatabaseSnapshotUseCase {
  getDatabase(): Promise<MockApiDatabase>;
  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase>;
}

export class DatabaseSnapshotUseCaseImpl implements DatabaseSnapshotUseCase {
  constructor(private readonly databaseRepository: DatabaseSnapshotRepository) {}

  getDatabase(): Promise<MockApiDatabase> {
    return this.databaseRepository.getDatabase();
  }

  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return this.databaseRepository.importDatabase(data, mode);
  }
}
