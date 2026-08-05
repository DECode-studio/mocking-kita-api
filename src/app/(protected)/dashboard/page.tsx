import DashboardView from '@/src/presentation/views/dashboard/DashboardView';
import { createDatabaseSnapshotUseCase } from '@/src/domain/database';

export default async function DashboardPage() {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const initialDb = await databaseSnapshotUseCase.getDatabase();
  return <DashboardView initialDb={initialDb} />;
}
