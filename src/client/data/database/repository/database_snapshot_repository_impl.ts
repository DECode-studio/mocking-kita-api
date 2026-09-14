import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { DatabaseSnapshotRepository } from '@/src/client/domain/database/repository/database_snapshot_repository';
import { DatabaseSnapshotRemoteDataSource } from '../data_source/database_snapshot_data_source';
import { DatabaseSnapshotRemoteDataSourceImpl } from '../data_source/database_snapshot_remote_data_source_impl';

export class DatabaseSnapshotRepositoryImpl implements DatabaseSnapshotRepository {
  constructor(private dataSource: DatabaseSnapshotRemoteDataSource = new DatabaseSnapshotRemoteDataSourceImpl()) {}

  async getDatabase(): Promise<MockApiDatabase> {
    return this.dataSource.getDatabaseSnapshot();
  }

  async importDatabase(data: MockApiDatabase, mode: 'replace' | 'merge'): Promise<MockApiDatabase> {
    return this.dataSource.importDatabaseSnapshot(data, mode);
  }
}
