import DashboardView from '@/src/client/presentation/views/dashboard/DashboardView';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

export default async function DashboardPage() {
  const dashboardUseCase = getService(CLIENT_DI_TOKENS.dashboardUseCase);
  const initialSummary = await dashboardUseCase.getSummary();
  return <DashboardView initialSummary={initialSummary} />;
}
