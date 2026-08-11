'use client';

import React from 'react';
import { useDashboard } from './useDashboard';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import {  createDatabaseSnapshotUseCase  } from '@/src/di/usecase_provider';
import { ROUTES } from '@/src/core/constants/routes';
import { DASHBOARD_SEMANTIC_ID } from './constant';
import {
  DashboardHero,
  DashboardStatsGrid,
  HttpMethodDistributionBar,
  RecentProjectsCard,
  ConfiguredEndpointsCard,
} from './components';

export const DashboardView: React.FC<{ initialDb?: MockApiDatabase }> = ({ initialDb }) => {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const {
    db,
    router,
    activeProjects,
    activeApis,
    methodCounts,
    totalApisCount,
    openImportExport,
  } = useDashboard(databaseSnapshotUseCase, initialDb);

  return (
    <div id={DASHBOARD_SEMANTIC_ID.CONTAINER} className="space-y-8">
      {/* Hero Section */}
      <DashboardHero
        onCreateProject={() => router.push('/projects?new=true')}
        onImportExport={openImportExport}
      />

      {/* Statistic Cards Grid */}
      <DashboardStatsGrid
        db={db}
        activeProjects={activeProjects}
        activeApis={activeApis}
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
          db={db}
          activeProjects={activeProjects}
          onNavigateViewAll={() => router.push(ROUTES.PROJECTS)}
          onNavigateProject={(projectId) => router.push(ROUTES.PROJECT_DETAIL(projectId))}
        />

        <ConfiguredEndpointsCard
          db={db}
          activeApis={activeApis}
          onNavigateApiDetail={(projectId, apiId) =>
            router.push(ROUTES.API_DETAIL(projectId, apiId))
          }
        />
      </div>
    </div>
  );
};

export default DashboardView;
