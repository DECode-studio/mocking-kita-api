import DashboardView from '@/src/presentation/views/dashboard/DashboardView';
import { getDashboardSummaryRemote } from '@/src/data/dashboard/api/dashboard_api_client';

export default async function DashboardPage() {
  const initialSummary = await getDashboardSummaryRemote();
  return <DashboardView initialSummary={initialSummary} />;
}
