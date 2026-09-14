import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { DatabaseSnapshotRepository } from '../repository/database_snapshot_repository';
import { DatabaseSnapshotUseCase } from './database_snapshot_usecase';

export class DatabaseSnapshotUseCaseImpl implements DatabaseSnapshotUseCase {
  constructor(private readonly databaseRepository: DatabaseSnapshotRepository) {}

  getDatabase(): Promise<MockApiDatabase> {
    return this.databaseRepository.getDatabase();
  }

  importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return this.databaseRepository.importDatabase(data, mode);
  }
}
