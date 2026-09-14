import prisma from '@/src/core/db/prisma-client';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';
import { INITIAL_SEED_DATA } from './seed-data';
import { Prisma } from '@prisma/client';

export async function readDatabase(): Promise<MockApiDatabase> {
  const [
    projectsRaw,
    environmentsRaw,
    collectionsRaw,
    apisRaw,
    apiEnvironmentsRaw,
    requestScenariosRaw,
    responseScenariosRaw,
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
      environmentType: e.environmentType as any,
      publicBaseUrl: e.publicBaseUrl ?? undefined,
      originBaseUrl: e.originBaseUrl ?? undefined,
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
      methodRequest: a.methodRequest as any,
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
      headers: (r.headers as any) ?? {},
      queryParams: (r.queryParams as any) ?? {},
      pathParams: (r.pathParams as any) ?? {},
      body: (r.body as any) ?? {},
      bodyType: r.bodyType as any,
      matchType: r.matchType as any,
      matchStrategy: (r.matchStrategy as any) || 'ALL',
      bodyRules: (r.bodyRules as any) ?? undefined,
      strictBodyStructure: (r as any).strictBodyStructure !== undefined ? (r as any).strictBodyStructure : true,
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
      headers: (r.headers as any) ?? {},
      body: (r.body as any) ?? {},
      responseType: r.responseType as any,
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
      await tx.responseScenario.deleteMany({});
      await tx.requestScenario.deleteMany({});
      await tx.apiEnvironment.deleteMany({});
      await tx.api.deleteMany({});
      await tx.collection.deleteMany({});
      await tx.environment.deleteMany({});
      await tx.project.deleteMany({});

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
            data: chunk.map((item) => ({
              id: item.id,
              projectId: item.projectId,
              name: item.name,
              environmentType: item.environmentType,
              publicBaseUrl: item.publicBaseUrl ?? null,
              originBaseUrl: item.originBaseUrl ?? null,
              status: item.status,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })),
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
      await tx.responseScenario.deleteMany({});
      await tx.requestScenario.deleteMany({});
      await tx.apiEnvironment.deleteMany({});
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
  };

  await seedDatabase(mergedDatabase);
  return readDatabase();
}
