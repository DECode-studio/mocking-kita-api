import prisma from '@/src/core/db/prisma-client';
import { MethodRequest } from '@/src/core/utils/types';
import { DashboardSummary } from '@/src/domain/dashboard/entity/dashboard_summary';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    projectCount,
    activeProjectCount,
    environmentCount,
    endpointCount,
    activeEndpointCount,
    requestScenarioCount,
    responseScenarioCount,
    methodGroups,
    recentProjectRows,
    endpointRows,
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { deletedAt: null, status: true } }),
    prisma.environment.count({ where: { deletedAt: null } }),
    prisma.api.count({ where: { deletedAt: null } }),
    prisma.api.count({ where: { deletedAt: null, status: true } }),
    prisma.requestScenario.count({ where: { deletedAt: null } }),
    prisma.responseScenario.count({ where: { deletedAt: null } }),
    prisma.api.groupBy({
      by: ['methodRequest'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, status: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.api.findMany({
      where: { deletedAt: null, status: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: 5,
      select: {
        id: true,
        projectId: true,
        name: true,
        path: true,
        methodRequest: true,
        status: true,
      },
    }),
  ]);

  const [recentProjects, configuredEndpoints] = await Promise.all([
    Promise.all(
      recentProjectRows.map(async (project) => {
        const [apiCount, environmentCountForProject] = await Promise.all([
          prisma.api.count({ where: { projectId: project.id, deletedAt: null } }),
          prisma.environment.count({ where: { projectId: project.id, deletedAt: null } }),
        ]);

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          createdAt: project.createdAt.toISOString(),
          apiCount,
          environmentCount: environmentCountForProject,
        };
      })
    ),
    Promise.all(
      endpointRows.map(async (api) => ({
        id: api.id,
        projectId: api.projectId,
        name: api.name,
        path: api.path,
        methodRequest: api.methodRequest as MethodRequest,
        status: api.status,
        requestScenarioCount: await prisma.requestScenario.count({
          where: { apiId: api.id, deletedAt: null },
        }),
      }))
    ),
  ]);

  return {
    projectCount,
    activeProjectCount,
    environmentCount,
    endpointCount,
    activeEndpointCount,
    requestScenarioCount,
    responseScenarioCount,
    methodCounts: Object.fromEntries(methodGroups.map((group) => [group.methodRequest, group._count._all])),
    recentProjects,
    configuredEndpoints,
  };
}
