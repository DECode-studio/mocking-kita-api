import prisma from '@/src/core/db/prisma-client';
import { getProjectById } from '@/src/server/project';
import { getCollectionsByProjectId } from '@/src/server/collection';
import { getApisByProjectId } from '@/src/server/api';
import { exportProjectToOpenApiSpec, parseOpenApiSpecToProjectData, OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { Prisma } from '@prisma/client';

/**
 * Export all endpoints, collections, and scenarios belonging strictly to a single project into OpenAPI 3.0 spec.
 */
export async function exportProjectOpenApi(projectId: string): Promise<OpenApiSpec> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  const collections = (await getCollectionsByProjectId(projectId)).filter((c) => !c.deletedAt);
  const apis = (await getApisByProjectId(projectId)).filter((a) => !a.deletedAt);

  const apiIds = apis.map((a) => a.id);
  let requestScenarios: RequestScenario[] = [];
  let responseScenarios: ResponseScenario[] = [];

  if (apiIds.length > 0) {
    const reqRows = await prisma.requestScenario.findMany({
      where: {
        apiId: { in: apiIds },
        deletedAt: null,
      },
    });

    requestScenarios = reqRows.map((r) => ({
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
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    }));

    const reqIds = requestScenarios.map((r) => r.id);
    if (reqIds.length > 0) {
      const respRows = await prisma.responseScenario.findMany({
        where: {
          requestScenarioId: { in: reqIds },
          deletedAt: null,
        },
      });

      responseScenarios = respRows.map((resp) => ({
        id: resp.id,
        requestScenarioId: resp.requestScenarioId,
        name: resp.name,
        description: resp.description ?? undefined,
        statusCode: resp.statusCode ?? 200,
        headers: (resp.headers as any) ?? {},
        body: (resp.body as any) ?? {},
        responseType: resp.responseType as any,
        filePath: resp.filePath ?? undefined,
        fileName: resp.fileName ?? undefined,
        delayMs: resp.delayMs,
        weight: resp.weight,
        priority: resp.priority,
        status: resp.status,
        createdAt: resp.createdAt.toISOString(),
        updatedAt: resp.updatedAt.toISOString(),
        deletedAt: resp.deletedAt ? resp.deletedAt.toISOString() : null,
      }));
    }
  }

  return exportProjectToOpenApiSpec(project, collections, apis, requestScenarios, responseScenarios);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const OPENAPI_IMPORT_CREATE_CHUNK_SIZE = 100;
const OPENAPI_IMPORT_UPDATE_CHUNK_SIZE = 20;

async function createManyInChunks<T>(items: T[], fn: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (const chunk of chunkArray(items, OPENAPI_IMPORT_CREATE_CHUNK_SIZE)) {
    await fn(chunk);
  }
}

async function updateInTransactionChunks<T>(
  items: T[],
  fn: (item: T) => Prisma.PrismaPromise<unknown>
): Promise<void> {
  for (const chunk of chunkArray(items, OPENAPI_IMPORT_UPDATE_CHUNK_SIZE)) {
    await prisma.$transaction(chunk.map(fn));
  }
}

type MergePlan = {
  colsToCreate: Array<Prisma.CollectionCreateManyInput>;
  colsToUpdate: Array<{ id: string; data: Prisma.CollectionUpdateInput }>;
  apisToCreate: Array<Prisma.ApiCreateManyInput>;
  apisToUpdate: Array<{ id: string; data: Prisma.ApiUncheckedUpdateInput }>;
  reqsToCreate: Array<Prisma.RequestScenarioCreateManyInput>;
  reqsToUpdate: Array<{ id: string; data: Prisma.RequestScenarioUncheckedUpdateInput }>;
  respsToCreate: Array<Prisma.ResponseScenarioCreateManyInput>;
  respsToUpdate: Array<{ id: string; data: Prisma.ResponseScenarioUncheckedUpdateInput }>;
  importedApiCount: number;
  updatedApiCount: number;
};

function buildMergePlan(
  projectId: string,
  extracted: ReturnType<typeof parseOpenApiSpecToProjectData>,
  existingCols: Array<{ id: string; name: string; description: string | null; status: boolean }>,
  existingApis: Array<{ id: string; collectionId: string | null; methodRequest: string; path: string; name: string; description: string | null; status: boolean }>,
  existingReqScenarios: Array<{ id: string; apiId: string; name: string; description: string | null; headers: unknown; queryParams: unknown; pathParams: unknown; body: unknown; bodyType: string; matchType: string; priority: number; status: boolean }>,
  existingRespScenarios: Array<{ id: string; requestScenarioId: string; name: string; description: string | null; statusCode: number | null; headers: unknown; body: unknown; responseType: string; filePath: string | null; fileName: string | null; delayMs: number; weight: number; priority: number; status: boolean }>
): MergePlan {
  const now = new Date();

  const colByNameMap = new Map<string, (typeof existingCols)[number]>();
  existingCols.forEach((c) => colByNameMap.set(c.name.toLowerCase(), c));

  const collectionIdRemap = new Map<string, string>();
  const colsToCreate: Array<Prisma.CollectionCreateManyInput> = [];
  const colsToUpdate: Array<{ id: string; data: Prisma.CollectionUpdateInput }> = [];

  for (const col of extracted.collections) {
    const existing = colByNameMap.get(col.name.toLowerCase());
    if (existing) {
      collectionIdRemap.set(col.id, existing.id);
      colsToUpdate.push({
        id: existing.id,
        data: {
          description: col.description ?? existing.description,
          status: col.status ?? true,
          updatedAt: now,
        },
      });
    } else {
      colByNameMap.set(col.name.toLowerCase(), { id: col.id, name: col.name } as any);
      colsToCreate.push({
        id: col.id,
        projectId,
        name: col.name,
        description: col.description ?? null,
        status: col.status ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const existingApiMap = new Map<string, (typeof existingApis)[number]>();
  existingApis.forEach((apiRow) => {
    const key = `${apiRow.methodRequest.toUpperCase()}::${apiRow.path}`;
    existingApiMap.set(key, apiRow);
  });

  const reqByApiIdMap = new Map<string, Array<(typeof existingReqScenarios)[number]>>();
  for (const reqRow of existingReqScenarios) {
    const list = reqByApiIdMap.get(reqRow.apiId) || [];
    list.push(reqRow);
    reqByApiIdMap.set(reqRow.apiId, list);
  }

  const respByReqIdMap = new Map<string, Array<(typeof existingRespScenarios)[number]>>();
  for (const respRow of existingRespScenarios) {
    const list = respByReqIdMap.get(respRow.requestScenarioId) || [];
    list.push(respRow);
    respByReqIdMap.set(respRow.requestScenarioId, list);
  }

  const reqsByApiIdMap = new Map<string, typeof extracted.requestScenarios>();
  for (const req of extracted.requestScenarios) {
    const list = reqsByApiIdMap.get(req.apiId) || [];
    list.push(req);
    reqsByApiIdMap.set(req.apiId, list);
  }

  const respsByReqIdMap = new Map<string, typeof extracted.responseScenarios>();
  for (const resp of extracted.responseScenarios) {
    const list = respsByReqIdMap.get(resp.requestScenarioId) || [];
    list.push(resp);
    respsByReqIdMap.set(resp.requestScenarioId, list);
  }

  const apisToCreate: Array<Prisma.ApiCreateManyInput> = [];
  const apisToUpdate: Array<{ id: string; data: Prisma.ApiUncheckedUpdateInput }> = [];

  const reqsToCreate: Array<Prisma.RequestScenarioCreateManyInput> = [];
  const reqsToUpdate: Array<{ id: string; data: Prisma.RequestScenarioUncheckedUpdateInput }> = [];

  const respsToCreate: Array<Prisma.ResponseScenarioCreateManyInput> = [];
  const respsToUpdate: Array<{ id: string; data: Prisma.ResponseScenarioUncheckedUpdateInput }> = [];

  let importedApiCount = 0;
  let updatedApiCount = 0;

  for (const api of extracted.apis) {
    const resolvedColId = (api.collectionId && collectionIdRemap.get(api.collectionId)) || api.collectionId || null;
    const apiKey = `${api.methodRequest.toUpperCase()}::${api.path}`;
    const existingApiRow = existingApiMap.get(apiKey);
    const reqScenarios = reqsByApiIdMap.get(api.id) || [];

    if (existingApiRow) {
      const targetApiId = existingApiRow.id;
      apisToUpdate.push({
        id: targetApiId,
        data: {
          collectionId: resolvedColId ?? existingApiRow.collectionId,
          name: api.name,
          description: api.description ?? existingApiRow.description,
          status: api.status ?? true,
          updatedAt: now,
        },
      });
      updatedApiCount++;

      const existingReqRows = reqByApiIdMap.get(targetApiId) || [];

      for (const req of reqScenarios) {
        const respScenarios = respsByReqIdMap.get(req.id) || [];
        const existingReq = existingReqRows.find((r) => r.name === req.name) || (existingReqRows.length === 1 ? existingReqRows[0] : undefined);

        if (existingReq) {
          reqsToUpdate.push({
            id: existingReq.id,
            data: {
              name: req.name,
              description: req.description ?? null,
              headers: (req.headers as Prisma.InputJsonValue) ?? {},
              queryParams: (req.queryParams as Prisma.InputJsonValue) ?? {},
              pathParams: (req.pathParams as Prisma.InputJsonValue) ?? {},
              body: (req.body as Prisma.InputJsonValue) ?? {},
              bodyType: req.bodyType ?? 'JSON',
              matchType: req.matchType ?? 'EXACT',
              priority: req.priority ?? 0,
              status: req.status ?? true,
              updatedAt: now,
            },
          });

          const existingRespRows = respByReqIdMap.get(existingReq.id) || [];
          for (const resp of respScenarios) {
            const existingResp = existingRespRows.find((r) => r.statusCode === resp.statusCode);
            if (existingResp) {
              respsToUpdate.push({
                id: existingResp.id,
                data: {
                  name: resp.name,
                  description: resp.description ?? null,
                  statusCode: resp.statusCode,
                  headers: (resp.headers as Prisma.InputJsonValue) ?? {},
                  body: (resp.body as Prisma.InputJsonValue) ?? {},
                  responseType: resp.responseType ?? 'JSON',
                  filePath: resp.filePath ?? null,
                  fileName: resp.fileName ?? null,
                  delayMs: resp.delayMs ?? 0,
                  weight: resp.weight ?? 100,
                  priority: resp.priority ?? 0,
                  status: resp.status ?? true,
                  updatedAt: now,
                },
              });
            } else {
              respsToCreate.push({
                id: resp.id,
                requestScenarioId: existingReq.id,
                name: resp.name,
                description: resp.description ?? null,
                statusCode: resp.statusCode,
                headers: (resp.headers as Prisma.InputJsonValue) ?? {},
                body: (resp.body as Prisma.InputJsonValue) ?? {},
                responseType: resp.responseType ?? 'JSON',
                filePath: resp.filePath ?? null,
                fileName: resp.fileName ?? null,
                delayMs: resp.delayMs ?? 0,
                weight: resp.weight ?? 100,
                priority: resp.priority ?? 0,
                status: resp.status ?? true,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        } else {
          reqsToCreate.push({
            id: req.id,
            apiId: targetApiId,
            name: req.name,
            description: req.description ?? null,
            headers: (req.headers as Prisma.InputJsonValue) ?? {},
            queryParams: (req.queryParams as Prisma.InputJsonValue) ?? {},
            pathParams: (req.pathParams as Prisma.InputJsonValue) ?? {},
            body: (req.body as Prisma.InputJsonValue) ?? {},
            bodyType: req.bodyType ?? 'JSON',
            matchType: req.matchType ?? 'EXACT',
            priority: req.priority ?? 0,
            status: req.status ?? true,
            createdAt: now,
            updatedAt: now,
          });

          for (const resp of respScenarios) {
            respsToCreate.push({
              id: resp.id,
              requestScenarioId: req.id,
              name: resp.name,
              description: resp.description ?? null,
              statusCode: resp.statusCode,
              headers: (resp.headers as Prisma.InputJsonValue) ?? {},
              body: (resp.body as Prisma.InputJsonValue) ?? {},
              responseType: resp.responseType ?? 'JSON',
              filePath: resp.filePath ?? null,
              fileName: resp.fileName ?? null,
              delayMs: resp.delayMs ?? 0,
              weight: resp.weight ?? 100,
              priority: resp.priority ?? 0,
              status: resp.status ?? true,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }
    } else {
      const targetApiId = api.id;
      apisToCreate.push({
        id: targetApiId,
        projectId,
        collectionId: resolvedColId,
        name: api.name,
        description: api.description ?? null,
        path: api.path,
        methodRequest: api.methodRequest,
        status: api.status ?? true,
        createdAt: now,
        updatedAt: now,
      });
      importedApiCount++;

      for (const req of reqScenarios) {
        reqsToCreate.push({
          id: req.id,
          apiId: targetApiId,
          name: req.name,
          description: req.description ?? null,
          headers: (req.headers as Prisma.InputJsonValue) ?? {},
          queryParams: (req.queryParams as Prisma.InputJsonValue) ?? {},
          pathParams: (req.pathParams as Prisma.InputJsonValue) ?? {},
          body: (req.body as Prisma.InputJsonValue) ?? {},
          bodyType: req.bodyType ?? 'JSON',
          matchType: req.matchType ?? 'EXACT',
          priority: req.priority ?? 0,
          status: req.status ?? true,
          createdAt: now,
          updatedAt: now,
        });

        const respScenarios = respsByReqIdMap.get(req.id) || [];
        for (const resp of respScenarios) {
          respsToCreate.push({
            id: resp.id,
            requestScenarioId: req.id,
            name: resp.name,
            description: resp.description ?? null,
            statusCode: resp.statusCode,
            headers: (resp.headers as Prisma.InputJsonValue) ?? {},
            body: (resp.body as Prisma.InputJsonValue) ?? {},
            responseType: resp.responseType ?? 'JSON',
            filePath: resp.filePath ?? null,
            fileName: resp.fileName ?? null,
            delayMs: resp.delayMs ?? 0,
            weight: resp.weight ?? 100,
            priority: resp.priority ?? 0,
            status: resp.status ?? true,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
  }

  return {
    colsToCreate,
    colsToUpdate,
    apisToCreate,
    apisToUpdate,
    reqsToCreate,
    reqsToUpdate,
    respsToCreate,
    respsToUpdate,
    importedApiCount,
    updatedApiCount,
  };
}

/**
 * Import an OpenAPI JSON document into a target project.
 */
export async function importProjectOpenApi(
  projectId: string,
  rawSpec: any,
  mode: 'upsert' | 'merge' | 'replace' = 'upsert'
): Promise<{ success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number }> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  const existingCollections = (await getCollectionsByProjectId(projectId)).filter((c) => !c.deletedAt);
  const extracted = parseOpenApiSpecToProjectData(projectId, rawSpec, existingCollections);
  const now = new Date();

  let importedApiCount = 0;
  let updatedApiCount = 0;

  if (mode === 'replace') {
    const projectApis = await prisma.api.findMany({
      where: { projectId },
      select: { id: true },
    });
    const projectApiIds = projectApis.map((a) => a.id);

    if (projectApiIds.length > 0) {
      const projectReqs = await prisma.requestScenario.findMany({
        where: { apiId: { in: projectApiIds } },
        select: { id: true },
      });
      const projectReqIds = projectReqs.map((r) => r.id);

      await prisma.$transaction([
        ...(projectReqIds.length > 0
          ? [
              prisma.responseScenario.deleteMany({
                where: { requestScenarioId: { in: projectReqIds } },
              }),
            ]
          : []),
        prisma.requestScenario.deleteMany({
          where: { apiId: { in: projectApiIds } },
        }),
        prisma.apiEnvironment.deleteMany({
          where: { apiId: { in: projectApiIds } },
        }),
        prisma.api.deleteMany({
          where: { projectId },
        }),
        prisma.collection.deleteMany({
          where: { projectId },
        }),
      ]);
    } else {
      await prisma.collection.deleteMany({
        where: { projectId },
      });
    }

    await createManyInChunks(extracted.collections, (chunk) =>
      prisma.collection.createMany({
        data: chunk.map((col) => ({
          id: col.id,
          projectId,
          name: col.name,
          description: col.description ?? null,
          status: col.status ?? true,
          createdAt: now,
          updatedAt: now,
        })),
      })
    );

    await createManyInChunks(extracted.apis, (chunk) =>
      prisma.api.createMany({
        data: chunk.map((api) => ({
          id: api.id,
          projectId,
          collectionId: api.collectionId ?? null,
          name: api.name,
          description: api.description ?? null,
          path: api.path,
          methodRequest: api.methodRequest,
          status: api.status ?? true,
          createdAt: now,
          updatedAt: now,
        })),
      })
    );

    await createManyInChunks(extracted.requestScenarios, (chunk) =>
      prisma.requestScenario.createMany({
        data: chunk.map((req) => ({
          id: req.id,
          apiId: req.apiId,
          name: req.name,
          description: req.description ?? null,
          headers: (req.headers as Prisma.InputJsonValue) ?? {},
          queryParams: (req.queryParams as Prisma.InputJsonValue) ?? {},
          pathParams: (req.pathParams as Prisma.InputJsonValue) ?? {},
          body: (req.body as Prisma.InputJsonValue) ?? {},
          bodyType: req.bodyType ?? 'JSON',
          matchType: req.matchType ?? 'EXACT',
          priority: req.priority ?? 0,
          status: req.status ?? true,
          createdAt: now,
          updatedAt: now,
        })),
      })
    );

    await createManyInChunks(extracted.responseScenarios, (chunk) =>
      prisma.responseScenario.createMany({
        data: chunk.map((resp) => ({
          id: resp.id,
          requestScenarioId: resp.requestScenarioId,
          name: resp.name,
          description: resp.description ?? null,
          statusCode: resp.statusCode ?? 200,
          headers: (resp.headers as Prisma.InputJsonValue) ?? {},
          body: (resp.body as Prisma.InputJsonValue) ?? {},
          responseType: resp.responseType ?? 'JSON',
          filePath: resp.filePath ?? null,
          fileName: resp.fileName ?? null,
          delayMs: resp.delayMs ?? 0,
          weight: resp.weight ?? 100,
          priority: resp.priority ?? 0,
          status: resp.status ?? true,
          createdAt: now,
          updatedAt: now,
        })),
      })
    );

    importedApiCount = extracted.apis.length;
  } else {
    const existingCols = await prisma.collection.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, name: true, description: true, status: true },
    });

    const existingApis = await prisma.api.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, collectionId: true, methodRequest: true, path: true, name: true, description: true, status: true },
    });

    const existingApiIds = existingApis.map((a) => a.id);
    const existingReqScenarios =
      existingApiIds.length > 0
        ? await prisma.requestScenario.findMany({
            where: { apiId: { in: existingApiIds }, deletedAt: null },
            select: {
              id: true,
              apiId: true,
              name: true,
              description: true,
              headers: true,
              queryParams: true,
              pathParams: true,
              body: true,
              bodyType: true,
              matchType: true,
              priority: true,
              status: true,
            },
          })
        : [];

    const existingReqIds = existingReqScenarios.map((r) => r.id);
    const existingRespScenarios =
      existingReqIds.length > 0
        ? await prisma.responseScenario.findMany({
            where: { requestScenarioId: { in: existingReqIds }, deletedAt: null },
            select: {
              id: true,
              requestScenarioId: true,
              name: true,
              description: true,
              statusCode: true,
              headers: true,
              body: true,
              responseType: true,
              filePath: true,
              fileName: true,
              delayMs: true,
              weight: true,
              priority: true,
              status: true,
            },
          })
        : [];

    const plan = buildMergePlan(projectId, extracted, existingCols as any, existingApis as any, existingReqScenarios as any, existingRespScenarios as any);
    importedApiCount = plan.importedApiCount;
    updatedApiCount = plan.updatedApiCount;

    await createManyInChunks(plan.colsToCreate, (chunk) => prisma.collection.createMany({ data: chunk }));
    await updateInTransactionChunks(plan.colsToUpdate, (item) =>
      prisma.collection.update({
        where: { id: item.id },
        data: item.data,
      })
    );

    await createManyInChunks(plan.apisToCreate, (chunk) => prisma.api.createMany({ data: chunk }));
    await updateInTransactionChunks(plan.apisToUpdate, (item) =>
      prisma.api.update({
        where: { id: item.id },
        data: item.data,
      })
    );

    await createManyInChunks(plan.reqsToCreate, (chunk) => prisma.requestScenario.createMany({ data: chunk }));
    await updateInTransactionChunks(plan.reqsToUpdate, (item) =>
      prisma.requestScenario.update({
        where: { id: item.id },
        data: item.data,
      })
    );

    await createManyInChunks(plan.respsToCreate, (chunk) => prisma.responseScenario.createMany({ data: chunk }));
    await updateInTransactionChunks(plan.respsToUpdate, (item) =>
      prisma.responseScenario.update({
        where: { id: item.id },
        data: item.data,
      })
    );
  }

  return {
    success: true,
    importedApiCount,
    updatedApiCount,
    importedCollectionCount: extracted.collections.length,
  };
}
