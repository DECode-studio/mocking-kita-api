import EnvironmentsView from '@/src/presentation/views/environments/EnvironmentsView';
import {  createDatabaseSnapshotUseCase  } from '@/src/di/usecase_provider';

export default async function EnvironmentsPage() {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const initialDb = await databaseSnapshotUseCase.getDatabase();
  return <EnvironmentsView initialEnvironments={initialDb.environments} />;
}
