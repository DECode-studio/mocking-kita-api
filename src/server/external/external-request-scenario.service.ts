import prisma from '@/src/core/db/prisma-client';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';

export interface UpsertRequestScenarioInput {
  id?: string | null;
  apiId: string;
  name: string;
  description?: string | null;
  headers?: any;
  queryParams?: any;
  pathParams?: any;
  body?: any;
  bodyType?: string;
  matchType?: string;
  matchStrategy?: string;
  bodyRules?: any;
  strictBodyStructure?: boolean;
  priority?: number;
  status?: boolean;
}

export async function upsertExternalRequestScenario(input: UpsertRequestScenarioInput) {
  if (!input.apiId || !input.name) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: "Fields 'apiId' and 'name' are required",
    };
  }

  // Verify API exists
  const api = await prisma.api.findUnique({
    where: { id: input.apiId },
  });

  if (!api) {
    return {
      success: false,
      status: 404,
      code: 'NOT_FOUND',
      message: `API with ID '${input.apiId}' not found`,
    };
  }

  let existingRecord = null;
  if (input.id) {
    existingRecord = await prisma.requestScenario.findUnique({
      where: { id: input.id },
    });
  }

  let action: 'CREATED' | 'UPDATED' = 'CREATED';
  let scenarioRecord;

  if (existingRecord) {
    action = 'UPDATED';
    scenarioRecord = await prisma.requestScenario.update({
      where: { id: existingRecord.id },
      data: {
        apiId: input.apiId,
        name: input.name,
        description: input.description !== undefined ? input.description : existingRecord.description,
        headers: input.headers !== undefined ? input.headers : existingRecord.headers,
        queryParams: input.queryParams !== undefined ? input.queryParams : existingRecord.queryParams,
        pathParams: input.pathParams !== undefined ? input.pathParams : existingRecord.pathParams,
        body: input.body !== undefined ? input.body : existingRecord.body,
        bodyType: input.bodyType || existingRecord.bodyType,
        matchType: input.matchType || existingRecord.matchType,
        matchStrategy: input.matchStrategy || existingRecord.matchStrategy,
        bodyRules: input.bodyRules !== undefined ? input.bodyRules : existingRecord.bodyRules,
        strictBodyStructure: input.strictBodyStructure !== undefined ? input.strictBodyStructure : existingRecord.strictBodyStructure,
        priority: input.priority !== undefined ? input.priority : existingRecord.priority,
        status: input.status !== undefined ? input.status : existingRecord.status,
        updatedAt: new Date(),
      },
    });
  } else {
    action = 'CREATED';
    scenarioRecord = await prisma.requestScenario.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        apiId: input.apiId,
        name: input.name,
        description: input.description ?? null,
        headers: input.headers ?? null,
        queryParams: input.queryParams ?? null,
        pathParams: input.pathParams ?? null,
        body: input.body ?? null,
        bodyType: input.bodyType || 'JSON',
        matchType: input.matchType || 'EXACT',
        matchStrategy: input.matchStrategy || 'ALL',
        bodyRules: input.bodyRules ?? null,
        strictBodyStructure: input.strictBodyStructure ?? true,
        priority: input.priority ?? 0,
        status: input.status ?? true,
      },
    });
  }

  clearInternalProxyCache();

  return {
    success: true,
    status: action === 'CREATED' ? 201 : 200,
    action,
    message: `Request scenario ${action === 'CREATED' ? 'created' : 'updated'} successfully`,
    data: {
      id: scenarioRecord.id,
      apiId: scenarioRecord.apiId,
      name: scenarioRecord.name,
      description: scenarioRecord.description,
      headers: scenarioRecord.headers,
      queryParams: scenarioRecord.queryParams,
      pathParams: scenarioRecord.pathParams,
      body: scenarioRecord.body,
      bodyType: scenarioRecord.bodyType,
      matchType: scenarioRecord.matchType,
      matchStrategy: scenarioRecord.matchStrategy,
      bodyRules: scenarioRecord.bodyRules,
      strictBodyStructure: scenarioRecord.strictBodyStructure,
      priority: scenarioRecord.priority,
      status: scenarioRecord.status,
      createdAt: scenarioRecord.createdAt.toISOString(),
      updatedAt: scenarioRecord.updatedAt.toISOString(),
    },
  };
}

export async function listExternalRequestScenarios(params: {
  apiId?: string;
  projectId?: string;
  path?: string;
  methodRequest?: string;
}) {
  let targetApiId = params.apiId;

  if (!targetApiId) {
    if (!params.projectId || !params.path || !params.methodRequest) {
      return {
        success: false,
        status: 400,
        code: 'BAD_REQUEST',
        message: "Must provide either 'apiId' OR ('projectId', 'path', and 'methodRequest')",
      };
    }

    let normalizedPath = params.path.trim();
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    const api = await prisma.api.findFirst({
      where: {
        projectId: params.projectId,
        path: normalizedPath,
        methodRequest: params.methodRequest.trim().toUpperCase(),
        deletedAt: null,
      },
    });

    if (!api) {
      return {
        success: false,
        status: 404,
        code: 'NOT_FOUND',
        message: 'No matching API found for the provided endpoint criteria',
      };
    }
    targetApiId = api.id;
  }

  const rows = await prisma.requestScenario.findMany({
    where: {
      apiId: targetApiId,
      deletedAt: null,
    },
    orderBy: { priority: 'desc' },
  });

  const formattedData = rows.map((row) => ({
    id: row.id,
    apiId: row.apiId,
    name: row.name,
    description: row.description,
    headers: row.headers,
    queryParams: row.queryParams,
    pathParams: row.pathParams,
    body: row.body,
    bodyType: row.bodyType,
    matchType: row.matchType,
    matchStrategy: row.matchStrategy,
    bodyRules: row.bodyRules,
    strictBodyStructure: row.strictBodyStructure,
    priority: row.priority,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    success: true,
    status: 200,
    data: formattedData,
  };
}
