'use client';


import React from 'react';
import { useDashboard } from './hook/useDashboard';
import { DashboardSummary } from '@/src/client/domain/dashboard/entity/dashboard_summary';
import { ROUTES } from '@/src/core/constants/routes';
import { DASHBOARD_SEMANTIC_ID } from './constant';
import {
  DashboardHero,
  DashboardStatsGrid,
  HttpMethodDistributionBar,
  RecentProjectsCard,
  ConfiguredEndpointsCard,
} from './components';

export const DashboardView: React.FC<{ initialSummary?: DashboardSummary }> = ({ initialSummary }) => {
  const {
    summary,
    router,
    methodCounts,
    totalApisCount,
  } = useDashboard(initialSummary);

  return (
    <div id={DASHBOARD_SEMANTIC_ID.CONTAINER} className="space-y-8">
      {/* Hero Section */}
      <DashboardHero
        onCreateProject={() => router.push('/projects?new=true')}
      />

      {/* Statistic Cards Grid */}
      <DashboardStatsGrid
        summary={summary}
        totalApisCount={totalApisCount}
      />

      {/* HTTP Method Distribution Bar */}
      <HttpMethodDistributionBar
        totalApisCount={totalApisCount}
        methodCounts={methodCounts}
      />

      {/* Main Grid: Recent Projects & Configured Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjectsCard
          projects={summary.recentProjects}
          onNavigateViewAll={() => router.push(ROUTES.PROJECTS)}
          onNavigateProject={(projectId) => router.push(ROUTES.PROJECT_DETAIL(projectId))}
        />

        <ConfiguredEndpointsCard
          endpoints={summary.configuredEndpoints}
          onNavigateApiDetail={(projectId, apiId) =>
            router.push(ROUTES.API_DETAIL(projectId, apiId))
          }
        />
      </div>
    </div>
  );
};

export default DashboardView;