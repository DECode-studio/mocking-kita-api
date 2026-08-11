import DashboardView from '@/src/presentation/views/dashboard/DashboardView';
import { createDatabaseSnapshotUseCase } from '@/src/di/usecase_provider';

export default async function DashboardPage() {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const initialDb = await databaseSnapshotUseCase.getDatabase();
  return <DashboardView initialDb={initialDb} />;
}
