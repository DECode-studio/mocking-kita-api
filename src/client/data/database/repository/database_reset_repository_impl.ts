import { DatabaseResetRepository } from '@/src/client/domain/database/repository/database_reset_repository';
import { DatabaseSnapshotRemoteDataSource } from '../data_source/database_snapshot_data_source';
import { DatabaseSnapshotRemoteDataSourceImpl } from '../data_source/database_snapshot_remote_data_source_impl';

export class DatabaseResetRepositoryImpl implements DatabaseResetRepository {
  constructor(private dataSource: DatabaseSnapshotRemoteDataSource = new DatabaseSnapshotRemoteDataSourceImpl()) {}

  async resetDatabase(): Promise<void> {
    await this.dataSource.resetDatabaseSnapshot();
  }
}
