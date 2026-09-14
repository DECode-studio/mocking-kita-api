import { MethodRequest } from '@/src/core/utils/types';

export type DashboardProjectSummary = {
  id: string;
  name: string;
  status: boolean;
  createdAt: string;
  apiCount: number;
  environmentCount: number;
};

export type DashboardEndpointSummary = {
  id: string;
  projectId: string;
  name: string;
  path: string;
  methodRequest: MethodRequest;
  status: boolean;
  requestScenarioCount: number;
};

export type DashboardSummary = {
  projectCount: number;
  activeProjectCount: number;
  environmentCount: number;
  endpointCount: number;
  activeEndpointCount: number;
  requestScenarioCount: number;
  responseScenarioCount: number;
  methodCounts: Record<string, number>;
  recentProjects: DashboardProjectSummary[];
  configuredEndpoints: DashboardEndpointSummary[];
};
