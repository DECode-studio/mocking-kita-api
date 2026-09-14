import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { ROUTES } from '@/src/core/constants/routes';

const emptySummary: DashboardSummary = {
  projectCount: 0,
  activeProjectCount: 0,
  environmentCount: 0,
  endpointCount: 0,
  activeEndpointCount: 0,
  requestScenarioCount: 0,
  responseScenarioCount: 0,
  methodCounts: {},
  recentProjects: [],
  configuredEndpoints: [],
};

export function useDashboard(
  initialSummary: DashboardSummary = emptySummary
) {
  const [summary] = useState<DashboardSummary>(initialSummary);
  const router = useRouter();

  const goToProjects = () => router.push(ROUTES.PROJECTS);

  return {
    summary,
    router,
    methodCounts: summary.methodCounts,
    totalApisCount: summary.endpointCount,
    goToProjects,
  };
}
