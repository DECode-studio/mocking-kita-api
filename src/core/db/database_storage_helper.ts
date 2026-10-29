import prisma from '@/src/core/db/prisma-client';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { Prisma } from '@prisma/client';
import {
  EnvironmentVariable,
  EnvironmentType,
  getEnvironmentBaseUrl,
  parseRawVariables,
  normalizeEnvironmentValues,
} from '@/src/client/domain/environment/entity/environment';
import { MethodRequest, RequestBodyType, MatchType, MatchStrategy, BodyPathRule } from '@/src/core/utils/types';
import { DataSheetFormat } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { generateId } from '@/src/core/utils/uuid';

export async function readDatabase(): Promise<MockApiDatabase> {
  const [
    projectsRaw,
    environmentsRaw,
    collectionsRaw,
    apisRaw,
    apiEnvironmentsRaw,
    requestScenariosRaw,
    responseScenariosRaw,
    dataSheetsRaw,
    scenarioFlowsRaw,
    scenarioFlowStepsRaw,
    scenarioFlowJobsRaw,
    projectPicsRaw,
    apiPicsRaw,
    aiApiKeysRaw,
    accountsRaw,
  ] = await Promise.all([
    prisma.project.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.environment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.collection.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.api.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.apiEnvironment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.requestScenario.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.responseScenario.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.dataSheet.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.scenarioFlow.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.scenarioFlowStep.findMany({
      orderBy: [{ flowId: 'asc' }, { stepOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.scenarioFlowJob.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.projectPic.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.apiPic.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.aiApiKey.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.account.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);

  return {
    version: '1.0.0',
    projects: projectsRaw.map((p) => ({
      id: p.id,
      name: p.name ?? '',
      description: p.description ?? undefined,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    })),
    environments: environmentsRaw.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      name: e.name,
      isBaseUrl: e.isBaseUrl !== false,
      values: (e.values as Record<string, unknown>) || {},
      environmentType: (e.environmentType as EnvironmentType) || null,
      variables: (e.variables as unknown as EnvironmentVariable[]) ?? [],
      baseUrl: getEnvironmentBaseUrl({ values: (e.values as Record<string, unknown>) || {}, isBaseUrl: e.isBaseUrl !== false }) || undefined,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
    })),
    collections: collectionsRaw.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      name: c.name,
      description: c.description ?? undefined,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    })),
    apiCollections: apisRaw.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      collectionId: a.collectionId ?? undefined,
      name: a.name,
      description: a.description ?? undefined,
      path: a.path,
      methodRequest: a.methodRequest as MethodRequest,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
    })),
    apiEnvironments: apiEnvironmentsRaw.map((ae) => ({
      id: ae.id,
      apiId: ae.apiId,
      environmentId: ae.environmentId,
      enabled: ae.enabled,
      pathOverride: ae.pathOverride ?? undefined,
      createdAt: ae.createdAt.toISOString(),
      updatedAt: ae.updatedAt.toISOString(),
    })),
    requestScenarios: requestScenariosRaw.map((r) => ({
      id: r.id,
      apiId: r.apiId,
      name: r.name,
      description: r.description ?? undefined,
      headers: (r.headers as Record<string, unknown>) ?? {},
      queryParams: (r.queryParams as Record<string, unknown>) ?? {},
      pathParams: (r.pathParams as Record<string, unknown>) ?? {},
      body: r.body,
      bodyType: r.bodyType as RequestBodyType,
      matchType: r.matchType as MatchType,
      matchStrategy: (r.matchStrategy as MatchStrategy) || 'ALL',
      bodyRules: (r.bodyRules as unknown as BodyPathRule[]) ?? undefined,
      strictBodyStructure: r.strictBodyStructure !== undefined ? r.strictBodyStructure : true,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    })),
    responseScenarios: responseScenariosRaw.map((r) => ({
      id: r.id,
      requestScenarioId: r.requestScenarioId,
      name: r.name,
      description: r.description ?? undefined,
      statusCode: r.statusCode ?? 200,
      headers: (r.headers as Record<string, unknown>) ?? {},
      body: r.body,
      responseType: r.responseType as 'JSON' | 'FILE',
      filePath: r.filePath ?? undefined,
      fileName: r.fileName ?? undefined,
      delayMs: r.delayMs,
      weight: r.weight,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    })),
    dataSheets: dataSheetsRaw.map((ds) => ({
      id: ds.id,
      projectId: ds.projectId,
      name: ds.name,
      code: ds.code,
      category: ds.category ?? undefined,
      description: ds.description ?? undefined,
      format: ds.format as DataSheetFormat,
      data: Array.isArray(ds.data) ? (ds.data as unknown[]) : [],
      status: ds.status,
      createdAt: ds.createdAt.toISOString(),
      updatedAt: ds.updatedAt.toISOString(),
      deletedAt: ds.deletedAt ? ds.deletedAt.toISOString() : null,
    })),
    scenarioFlows: scenarioFlowsRaw.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      description: f.description ?? undefined,
      status: f.status,
      defaultEnvironmentId: f.defaultEnvironmentId,
      stopOnFailure: f.stopOnFailure,
      variables: (f.variables as Record<string, unknown>) ?? undefined,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      deletedAt: f.deletedAt ? f.deletedAt.toISOString() : null,
    })),
    scenarioFlowSteps: scenarioFlowStepsRaw.map((s) => ({
      id: s.id,
      flowId: s.flowId,
      apiId: s.apiId,
      requestScenarioId: s.requestScenarioId,
      stepOrder: s.stepOrder,
      name: s.name,
      description: s.description ?? undefined,
      enabled: s.enabled,
      delayMs: s.delayMs,
      continueOnError: s.continueOnError,
      methodOverride: s.methodOverride,
      pathOverride: s.pathOverride,
      headersOverride: (s.headersOverride as Record<string, string>) ?? undefined,
      queryParamsOverride: (s.queryParamsOverride as Record<string, string>) ?? undefined,
      pathParamsOverride: (s.pathParamsOverride as Record<string, string>) ?? undefined,
      bodyOverride: s.bodyOverride,
      bodyType: s.bodyType,
      extractors: (s.extractors as any) ?? undefined,
      assertions: (s.assertions as any) ?? undefined,
      targetEnvironmentType: s.targetEnvironmentType,
      targetEnvironment: s.targetEnvironment,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    scenarioFlowJobs: scenarioFlowJobsRaw.map((j) => ({
      id: j.id,
      projectId: j.projectId,
      flowId: j.flowId,
      environmentId: j.environmentId,
      name: j.name,
      description: j.description ?? undefined,
      status: j.status as any,
      scheduleType: j.scheduleType as any,
      cronExpression: j.cronExpression,
      intervalSeconds: j.intervalSeconds,
      scheduledAt: j.scheduledAt ? j.scheduledAt.toISOString() : null,
      targetMode: j.targetMode as any,
      stopCondition: j.stopCondition as any,
      maxIterations: j.maxIterations,
      currentIteration: j.currentIteration,
      endAt: j.endAt ? j.endAt.toISOString() : null,
      dataSourceType: j.dataSourceType as any,
      dataSheetId: j.dataSheetId,
      dataIterationMode: j.dataIterationMode as any,
      dataSheetCurrentIndex: j.dataSheetCurrentIndex,
      customVariables: (j.customVariables as Record<string, unknown>) ?? undefined,
      lastRunAt: j.lastRunAt ? j.lastRunAt.toISOString() : null,
      nextRunAt: j.nextRunAt ? j.nextRunAt.toISOString() : null,
      lastStatus: j.lastStatus,
      lastError: j.lastError,
      totalRuns: j.totalRuns,
      successRuns: j.successRuns,
      failedRuns: j.failedRuns,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      deletedAt: j.deletedAt ? j.deletedAt.toISOString() : null,
    })),
    projectPics: projectPicsRaw.map((pp) => ({
      id: pp.id,
      projectId: pp.projectId,
      accountId: pp.accountId,
      createdAt: pp.createdAt.toISOString(),
    })),
    apiPics: apiPicsRaw.map((ap) => ({
      id: ap.id,
      apiId: ap.apiId,
      accountId: ap.accountId,
      createdAt: ap.createdAt.toISOString(),
    })),
    aiApiKeys: aiApiKeysRaw.map((k) => ({
      id: k.id,
      name: k.name,
      provider: k.provider,
      encryptedKey: k.encryptedKey,
      keyHint: k.keyHint,
      priority: k.priority,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      failureCount: k.failureCount,
      lastError: k.lastError,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    })),
    accounts: accountsRaw.map((u) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role,
      name: u.name,
      googleId: u.googleId,
      hasCustomPassword: u.hasCustomPassword,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const CHUNK_SIZE = 100;

export async function seedDatabase(data: MockApiDatabase): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.scenarioFlowExecutionStep.deleteMany({});
      await tx.scenarioFlowExecution.deleteMany({});
      await tx.scenarioFlowJob.deleteMany({});
      await tx.scenarioFlowStep.deleteMany({});
      await tx.scenarioFlow.deleteMany({});
      await tx.dataSheet.deleteMany({});
      await tx.responseScenario.deleteMany({});
      await tx.requestScenario.deleteMany({});
      await tx.apiEnvironment.deleteMany({});
      await tx.apiPic.deleteMany({});
      await tx.projectPic.deleteMany({});
      await tx.api.deleteMany({});
      await tx.collection.deleteMany({});
      await tx.environment.deleteMany({});
      await tx.project.deleteMany({});
      if (data.aiApiKeys && data.aiApiKeys.length > 0) {
        await tx.aiApiKey.deleteMany({});
      }

      if (data.accounts && data.accounts.length > 0) {
        for (const chunk of chunkArray(data.accounts, CHUNK_SIZE)) {
          await tx.account.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              username: item.username,
              password: item.password || '$2b$10$hasheddefaultplaceholder',
              role: item.role,
              name: item.name,
              googleId: item.googleId ?? null,
              hasCustomPassword: item.hasCustomPassword === true,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.projects && data.projects.length > 0) {
        for (const chunk of chunkArray(data.projects, CHUNK_SIZE)) {
          await tx.project.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description ?? null,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.environments && data.environments.length > 0) {
        for (const chunk of chunkArray(data.environments, CHUNK_SIZE)) {
          await tx.environment.createMany({
            data: chunk.map((item) => {
              const isBaseUrl = item.isBaseUrl !== false;
              const cleanBaseUrl = item.baseUrl ? String(item.baseUrl).trim() : '';
              const values = normalizeEnvironmentValues(item.values, isBaseUrl);
              const vars = parseRawVariables(item.variables);
              if (cleanBaseUrl && !vars.some((v) => v.key.toLowerCase() === 'baseurl' || v.key.toLowerCase() === 'base_url')) {
                vars.push({ id: generateId(), key: 'baseUrl', value: cleanBaseUrl, type: 'plain', enabled: true });
              }
              return {
                id: item.id,
                projectId: item.projectId,
                name: item.name,
                isBaseUrl,
                values: values as unknown as Prisma.InputJsonValue,
                environmentType: item.environmentType,
                variables: vars as unknown as Prisma.InputJsonValue,
                status: item.status !== false,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
                deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
              };
            }),
          });
        }
      }

      if (data.collections && data.collections.length > 0) {
        for (const chunk of chunkArray(data.collections, CHUNK_SIZE)) {
          await tx.collection.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId,
              name: item.name,
              description: item.description ?? null,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.apiCollections && data.apiCollections.length > 0) {
        for (const chunk of chunkArray(data.apiCollections, CHUNK_SIZE)) {
          await tx.api.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId,
              collectionId: item.collectionId ?? null,
              name: item.name,
              description: item.description ?? null,
              path: item.path,
              methodRequest: item.methodRequest,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.apiEnvironments && data.apiEnvironments.length > 0) {
        for (const chunk of chunkArray(data.apiEnvironments, CHUNK_SIZE)) {
          await tx.apiEnvironment.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              apiId: item.apiId,
              environmentId: item.environmentId,
              enabled: item.enabled,
              pathOverride: item.pathOverride ?? null,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          });
        }
      }

      if (data.requestScenarios && data.requestScenarios.length > 0) {
        for (const chunk of chunkArray(data.requestScenarios, CHUNK_SIZE)) {
          await tx.requestScenario.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              apiId: item.apiId,
              name: item.name,
              description: item.description ?? null,
              headers: (item.headers as Prisma.InputJsonValue) ?? {},
              queryParams: (item.queryParams as Prisma.InputJsonValue) ?? {},
              pathParams: (item.pathParams as Prisma.InputJsonValue) ?? {},
              body: (item.body as Prisma.InputJsonValue) ?? {},
              bodyType: item.bodyType ?? 'JSON',
              matchType: item.matchType ?? 'EXACT',
              matchStrategy: item.matchStrategy ?? 'ALL',
              bodyRules: (item.bodyRules as Prisma.InputJsonValue) ?? Prisma.DbNull,
              strictBodyStructure: item.strictBodyStructure !== undefined ? item.strictBodyStructure : true,
              priority: item.priority ?? 0,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.responseScenarios && data.responseScenarios.length > 0) {
        for (const chunk of chunkArray(data.responseScenarios, CHUNK_SIZE)) {
          await tx.responseScenario.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              requestScenarioId: item.requestScenarioId,
              name: item.name,
              description: item.description ?? null,
              statusCode: item.statusCode ?? 200,
              headers: (item.headers as Prisma.InputJsonValue) ?? {},
              body: (item.body as Prisma.InputJsonValue) ?? {},
              responseType: item.responseType ?? 'JSON',
              filePath: item.filePath ?? null,
              fileName: item.fileName ?? null,
              delayMs: item.delayMs ?? 0,
              weight: item.weight ?? 100,
              priority: item.priority ?? 0,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.dataSheets && data.dataSheets.length > 0) {
        for (const chunk of chunkArray(data.dataSheets, CHUNK_SIZE)) {
          await tx.dataSheet.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId ?? null,
              name: item.name,
              code: item.code,
              category: item.category ?? null,
              description: item.description ?? null,
              format: item.format || 'LIST',
              data: (item.data as Prisma.InputJsonValue) ?? [],
              status: item.status !== false,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.scenarioFlows && data.scenarioFlows.length > 0) {
        for (const chunk of chunkArray(data.scenarioFlows, CHUNK_SIZE)) {
          await tx.scenarioFlow.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId ?? null,
              name: item.name,
              description: item.description ?? null,
              status: item.status !== false,
              defaultEnvironmentId: item.defaultEnvironmentId ?? null,
              stopOnFailure: item.stopOnFailure !== false,
              variables: (item.variables as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.scenarioFlowSteps && data.scenarioFlowSteps.length > 0) {
        for (const chunk of chunkArray(data.scenarioFlowSteps, CHUNK_SIZE)) {
          await tx.scenarioFlowStep.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              flowId: item.flowId,
              apiId: item.apiId ?? null,
              requestScenarioId: item.requestScenarioId ?? null,
              stepOrder: item.stepOrder ?? 0,
              name: item.name,
              description: item.description ?? null,
              enabled: item.enabled !== false,
              delayMs: item.delayMs ?? 0,
              continueOnError: item.continueOnError === true,
              methodOverride: item.methodOverride ?? null,
              pathOverride: item.pathOverride ?? null,
              headersOverride: (item.headersOverride as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              queryParamsOverride: (item.queryParamsOverride as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              pathParamsOverride: (item.pathParamsOverride as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              bodyOverride: (item.bodyOverride as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              bodyType: item.bodyType ?? 'JSON',
              extractors: (item.extractors as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              assertions: (item.assertions as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              targetEnvironmentType: item.targetEnvironmentType ?? 'DEFAULT',
              targetEnvironment: item.targetEnvironment ?? null,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          });
        }
      }

      if (data.scenarioFlowJobs && data.scenarioFlowJobs.length > 0) {
        for (const chunk of chunkArray(data.scenarioFlowJobs, CHUNK_SIZE)) {
          await tx.scenarioFlowJob.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId ?? null,
              flowId: item.flowId,
              environmentId: item.environmentId ?? null,
              name: item.name,
              description: item.description ?? null,
              status: item.status || 'ACTIVE',
              scheduleType: item.scheduleType || 'CRON',
              cronExpression: item.cronExpression ?? null,
              intervalSeconds: item.intervalSeconds ?? null,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              targetMode: item.targetMode || 'LIVE',
              stopCondition: item.stopCondition || 'FOREVER',
              maxIterations: item.maxIterations ?? null,
              currentIteration: item.currentIteration ?? 0,
              endAt: item.endAt ? new Date(item.endAt) : null,
              dataSourceType: item.dataSourceType || 'NONE',
              dataSheetId: item.dataSheetId ?? null,
              dataIterationMode: item.dataIterationMode || 'PER_TICK',
              dataSheetCurrentIndex: item.dataSheetCurrentIndex ?? 0,
              customVariables: (item.customVariables as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
              lastRunAt: item.lastRunAt ? new Date(item.lastRunAt) : null,
              nextRunAt: item.nextRunAt ? new Date(item.nextRunAt) : null,
              lastStatus: item.lastStatus ?? null,
              lastError: item.lastError ?? null,
              totalRuns: item.totalRuns ?? 0,
              successRuns: item.successRuns ?? 0,
              failedRuns: item.failedRuns ?? 0,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
          });
        }
      }

      if (data.projectPics && data.projectPics.length > 0) {
        for (const chunk of chunkArray(data.projectPics, CHUNK_SIZE)) {
          await tx.projectPic.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId,
              accountId: item.accountId,
              createdAt: new Date(item.createdAt),
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.apiPics && data.apiPics.length > 0) {
        for (const chunk of chunkArray(data.apiPics, CHUNK_SIZE)) {
          await tx.apiPic.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              apiId: item.apiId,
              accountId: item.accountId,
              createdAt: new Date(item.createdAt),
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.aiApiKeys && data.aiApiKeys.length > 0) {
        for (const chunk of chunkArray(data.aiApiKeys, CHUNK_SIZE)) {
          await tx.aiApiKey.createMany({
            data: chunk.map((item) => ({
              id: item.id,
              name: item.name,
              provider: item.provider,
              encryptedKey: item.encryptedKey,
              keyHint: item.keyHint,
              priority: item.priority ?? 1,
              isActive: item.isActive !== false,
              lastUsedAt: item.lastUsedAt ? new Date(item.lastUsedAt) : null,
              failureCount: item.failureCount ?? 0,
              lastError: item.lastError ?? null,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
            skipDuplicates: true,
          });
        }
      }
    },
    {
      maxWait: 30000,
      timeout: 300000, // 5 minutes
    }
  );
}

export async function wipeAllDatabaseData(): Promise<MockApiDatabase> {
  await prisma.$transaction(
    async (tx) => {
      await tx.scenarioFlowExecutionStep.deleteMany({});
      await tx.scenarioFlowExecution.deleteMany({});
      await tx.scenarioFlowJob.deleteMany({});
      await tx.scenarioFlowStep.deleteMany({});
      await tx.scenarioFlow.deleteMany({});
      await tx.dataSheet.deleteMany({});
      await tx.responseScenario.deleteMany({});
      await tx.requestScenario.deleteMany({});
      await tx.apiEnvironment.deleteMany({});
      await tx.apiPic.deleteMany({});
      await tx.projectPic.deleteMany({});
      await tx.api.deleteMany({});
      await tx.collection.deleteMany({});
      await tx.environment.deleteMany({});
      await tx.project.deleteMany({});
    },
    {
      maxWait: 15000,
      timeout: 60000,
    }
  );
  return readDatabase();
}

export async function resetDatabaseToSeed(): Promise<MockApiDatabase> {
  return wipeAllDatabaseData();
}

export async function importDatabaseData(
  importedData: MockApiDatabase,
  mode: 'replace' | 'merge'
): Promise<MockApiDatabase> {
  if (mode === 'replace') {
    await seedDatabase(importedData);
    return readDatabase();
  }

  const current = await readDatabase();

  const mergeByMap = <T extends { id: string }>(source: T[], incoming: T[] = []) => {
    const map = new Map<string, T>();
    source.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const mergedDatabase: MockApiDatabase = {
    version: importedData.version || current.version,
    projects: mergeByMap(current.projects, importedData.projects),
    environments: mergeByMap(current.environments, importedData.environments),
    collections: mergeByMap(current.collections, importedData.collections),
    apiCollections: mergeByMap(current.apiCollections, importedData.apiCollections),
    apiEnvironments: mergeByMap(current.apiEnvironments, importedData.apiEnvironments),
    requestScenarios: mergeByMap(current.requestScenarios, importedData.requestScenarios),
    responseScenarios: mergeByMap(current.responseScenarios, importedData.responseScenarios),
    dataSheets: mergeByMap(current.dataSheets || [], importedData.dataSheets || []),
    scenarioFlows: mergeByMap(current.scenarioFlows || [], importedData.scenarioFlows || []),
    scenarioFlowSteps: mergeByMap(current.scenarioFlowSteps || [], importedData.scenarioFlowSteps || []),
    scenarioFlowJobs: mergeByMap(current.scenarioFlowJobs || [], importedData.scenarioFlowJobs || []),
    projectPics: mergeByMap(current.projectPics || [], importedData.projectPics || []),
    apiPics: mergeByMap(current.apiPics || [], importedData.apiPics || []),
    aiApiKeys: mergeByMap(current.aiApiKeys || [], importedData.aiApiKeys || []),
    accounts: mergeByMap(current.accounts || [], importedData.accounts || []),
  };

  await seedDatabase(mergedDatabase);
  return readDatabase();
}
