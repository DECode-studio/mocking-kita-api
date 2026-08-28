import prisma from '@/src/core/db/prisma-client';
import { getProjectById } from '@/src/data/project/data_source/project_data_source_impl';
import { getCollectionsByProjectId } from '@/src/data/collection/data_source/collection_data_source_impl';
import { getApisByProjectId } from '@/src/data/api/data_source/api_data_source_impl';
import { exportProjectToOpenApiSpec, parseOpenApiSpecToProjectData, OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
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

  await prisma.$transaction(async (tx) => {
    if (mode === 'replace') {
      const projectApis = await tx.api.findMany({
        where: { projectId },
        select: { id: true },
      });
      const projectApiIds = projectApis.map((a) => a.id);

      if (projectApiIds.length > 0) {
        const projectReqs = await tx.requestScenario.findMany({
          where: { apiId: { in: projectApiIds } },
          select: { id: true },
        });
        const projectReqIds = projectReqs.map((r) => r.id);

        if (projectReqIds.length > 0) {
          await tx.responseScenario.deleteMany({
            where: { requestScenarioId: { in: projectReqIds } },
          });
        }

        await tx.requestScenario.deleteMany({
          where: { apiId: { in: projectApiIds } },
        });
        await tx.apiEnvironment.deleteMany({
          where: { apiId: { in: projectApiIds } },
        });
        await tx.api.deleteMany({
          where: { projectId },
        });
      }

      await tx.collection.deleteMany({
        where: { projectId },
      });
    }

    // Upsert Collections
    for (const col of extracted.collections) {
      const existingCol = await tx.collection.findFirst({
        where: {
          projectId,
          name: { equals: col.name, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      if (existingCol) {
        await tx.collection.update({
          where: { id: existingCol.id },
          data: {
            description: col.description ?? existingCol.description,
            status: col.status ?? true,
            updatedAt: now,
          },
        });
      } else {
        await tx.collection.create({
          data: {
            id: col.id,
            projectId,
            name: col.name,
            description: col.description ?? null,
            status: col.status ?? true,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    if (mode === 'upsert') {
      const existingApis = await tx.api.findMany({
        where: { projectId, deletedAt: null },
      });

      const existingApiMap = new Map<string, typeof existingApis[0]>();
      for (const apiRow of existingApis) {
        const key = `${apiRow.methodRequest.toUpperCase()}::${apiRow.path}`;
        existingApiMap.set(key, apiRow);
      }

      for (const api of extracted.apis) {
        const apiKey = `${api.methodRequest.toUpperCase()}::${api.path}`;
        const existingApiRow = existingApiMap.get(apiKey);

        if (existingApiRow) {
          const targetApiId = existingApiRow.id;
          await tx.api.update({
            where: { id: targetApiId },
            data: {
              collectionId: api.collectionId ?? existingApiRow.collectionId,
              name: api.name,
              description: api.description ?? existingApiRow.description,
              status: api.status ?? true,
              updatedAt: now,
            },
          });
          updatedApiCount++;

          const reqScenarios = extracted.requestScenarios.filter((r) => r.apiId === api.id);
          const existingReqRows = await tx.requestScenario.findMany({
            where: { apiId: targetApiId, deletedAt: null },
          });

          for (const req of reqScenarios) {
            const respScenarios = extracted.responseScenarios.filter((resp) => resp.requestScenarioId === req.id);
            const existingReq = existingReqRows.find((r) => r.name === req.name) || existingReqRows[0];

            if (existingReq) {
              await tx.requestScenario.update({
                where: { id: existingReq.id },
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

              const existingRespRows = await tx.responseScenario.findMany({
                where: { requestScenarioId: existingReq.id, deletedAt: null },
              });

              for (const resp of respScenarios) {
                const existingResp = existingRespRows.find((r) => r.statusCode === resp.statusCode);
                if (existingResp) {
                  await tx.responseScenario.update({
                    where: { id: existingResp.id },
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
                  await tx.responseScenario.create({
                    data: {
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
                    },
                  });
                }
              }
            } else {
              await tx.requestScenario.create({
                data: {
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
                },
              });

              for (const resp of respScenarios) {
                await tx.responseScenario.create({
                  data: {
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
                  },
                });
              }
            }
          }
        } else {
          const targetApiId = api.id;
          await tx.api.create({
            data: {
              id: targetApiId,
              projectId,
              collectionId: api.collectionId ?? null,
              name: api.name,
              description: api.description ?? null,
              path: api.path,
              methodRequest: api.methodRequest,
              status: api.status ?? true,
              createdAt: now,
              updatedAt: now,
            },
          });
          importedApiCount++;

          const reqScenarios = extracted.requestScenarios.filter((r) => r.apiId === api.id);
          for (const req of reqScenarios) {
            await tx.requestScenario.create({
              data: {
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
              },
            });

            const respScenarios = extracted.responseScenarios.filter((resp) => resp.requestScenarioId === req.id);
            for (const resp of respScenarios) {
              await tx.responseScenario.create({
                data: {
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
                },
              });
            }
          }
        }
      }
    } else {
      // mode === 'merge' or 'replace'
      for (const api of extracted.apis) {
        await tx.api.upsert({
          where: {
            tblApi_index_0: {
              projectId,
              path: api.path,
              methodRequest: api.methodRequest,
            },
          },
          update: {
            collectionId: api.collectionId ?? null,
            name: api.name,
            description: api.description ?? null,
            status: api.status ?? true,
            updatedAt: now,
          },
          create: {
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
          },
        });
      }
      importedApiCount = extracted.apis.length;

      for (const req of extracted.requestScenarios) {
        await tx.requestScenario.create({
          data: {
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
          },
        });
      }

      for (const resp of extracted.responseScenarios) {
        await tx.responseScenario.create({
          data: {
            id: resp.id,
            requestScenarioId: resp.requestScenarioId,
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
          },
        });
      }
    }
  });

  return {
    success: true,
    importedApiCount,
    updatedApiCount,
    importedCollectionCount: extracted.collections.length,
  };
}
