import DashboardView from '@/src/client/presentation/views/dashboard/DashboardView';
import { getDashboardSummary } from '@/src/server/database/database-dashboard-summary.service';

export default async function DashboardPage() {
  try {
    const initialSummary = await getDashboardSummary();
    return <DashboardView initialSummary={initialSummary} />;
  } catch (error) {
    console.error('[DashboardPage] Failed to fetch initial dashboard summary:', error);
    return <DashboardView />;
  }
}
