import DashboardView from '@/src/presentation/views/dashboard/DashboardView';
import { readDatabase } from '@/src/core/db/database_storage_helper';

export default function DashboardPage() {
  const initialDb = readDatabase();
  return <DashboardView initialDb={initialDb} />;
}
