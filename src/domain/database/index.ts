import { databaseSnapshotRepository } from '@/src/data/database/snapshot/database_snapshot_repository_impl';
import { resetDatabaseRepository } from '@/src/data/database/admin/reset_database_repository_impl';
import { DatabaseSnapshotUseCaseImpl } from './usecase/database_snapshot_usecase';
import { DatabaseResetUseCaseImpl } from './usecase/database_reset_usecase';

export function createDatabaseSnapshotUseCase() {
  return new DatabaseSnapshotUseCaseImpl(databaseSnapshotRepository);
}

export function createDatabaseResetUseCase() {
  return new DatabaseResetUseCaseImpl(resetDatabaseRepository);
}
