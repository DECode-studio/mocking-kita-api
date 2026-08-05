import { DatabaseSnapshotUseCaseImpl } from '@/src/domain/database/usecase/database_snapshot_usecase';
import { databaseSnapshotRepository } from '@/src/infrastructure/database/database_snapshot_repository_impl';

export const databaseSnapshotUseCase = new DatabaseSnapshotUseCaseImpl(databaseSnapshotRepository);
