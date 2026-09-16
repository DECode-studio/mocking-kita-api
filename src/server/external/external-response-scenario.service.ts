import prisma from '@/src/core/db/prisma-client';
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';

export interface UpsertResponseScenarioInput {
  id?: string | null;
  requestScenarioId: string;
  name: string;
  description?: string | null;
  statusCode?: number;
  headers?: any;
  body?: any;
  responseType?: string;
  filePath?: string | null;
  fileName?: string | null;
  delayMs?: number;
  weight?: number;
  priority?: number;
  status?: boolean;
}

export async function upsertExternalResponseScenario(input: UpsertResponseScenarioInput) {
  if (!input.requestScenarioId || !input.name) {
    return {
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
      message: "Fields 'requestScenarioId' and 'name' are required",
    };
  }

  // Verify Request Scenario exists
  const reqScenario = await prisma.requestScenario.findUnique({
    where: { id: input.requestScenarioId },
  });

  if (!reqScenario) {
    return {
      success: false,
      status: 404,
      code: 'NOT_FOUND',
      message: `Request scenario with ID '${input.requestScenarioId}' not found`,
    };
  }

  let existingRecord = null;
  if (input.id) {
    existingRecord = await prisma.responseScenario.findUnique({
      where: { id: input.id },
    });
  }

  let action: 'CREATED' | 'UPDATED' = 'CREATED';
  let scenarioRecord;

  if (existingRecord) {
    action = 'UPDATED';
    scenarioRecord = await prisma.responseScenario.update({
      where: { id: existingRecord.id },
      data: {
        requestScenarioId: input.requestScenarioId,
        name: input.name,
        description: input.description !== undefined ? input.description : existingRecord.description,
        statusCode: input.statusCode !== undefined ? input.statusCode : existingRecord.statusCode,
        headers: input.headers !== undefined ? input.headers : existingRecord.headers,
        body: input.body !== undefined ? input.body : existingRecord.body,
        responseType: input.responseType || existingRecord.responseType,
        filePath: input.filePath !== undefined ? input.filePath : existingRecord.filePath,
        fileName: input.fileName !== undefined ? input.fileName : existingRecord.fileName,
        delayMs: input.delayMs !== undefined ? input.delayMs : existingRecord.delayMs,
        weight: input.weight !== undefined ? input.weight : existingRecord.weight,
        priority: input.priority !== undefined ? input.priority : existingRecord.priority,
        status: input.status !== undefined ? input.status : existingRecord.status,
        updatedAt: new Date(),
      },
    });
  } else {
    action = 'CREATED';
    scenarioRecord = await prisma.responseScenario.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        requestScenarioId: input.requestScenarioId,
        name: input.name,
        description: input.description ?? null,
        statusCode: input.statusCode ?? 200,
        headers: input.headers ?? null,
        body: input.body ?? null,
        responseType: input.responseType || 'JSON',
        filePath: input.filePath ?? null,
        fileName: input.fileName ?? null,
        delayMs: input.delayMs ?? 0,
        weight: input.weight ?? 100,
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
    message: `Response scenario ${action === 'CREATED' ? 'created' : 'updated'} successfully`,
    data: {
      id: scenarioRecord.id,
      requestScenarioId: scenarioRecord.requestScenarioId,
      name: scenarioRecord.name,
      description: scenarioRecord.description,
      statusCode: scenarioRecord.statusCode,
      headers: scenarioRecord.headers,
      body: scenarioRecord.body,
      responseType: scenarioRecord.responseType,
      filePath: scenarioRecord.filePath,
      fileName: scenarioRecord.fileName,
      delayMs: scenarioRecord.delayMs,
      weight: scenarioRecord.weight,
      priority: scenarioRecord.priority,
      status: scenarioRecord.status,
      createdAt: scenarioRecord.createdAt.toISOString(),
      updatedAt: scenarioRecord.updatedAt.toISOString(),
    },
  };
}

export async function listExternalResponseScenarios(params: {
  requestScenarioId?: string;
  projectId?: string;
  path?: string;
  methodRequest?: string;
}) {
  let requestScenarioIds: string[] = [];

  if (params.requestScenarioId) {
    requestScenarioIds = [params.requestScenarioId];
  } else {
    if (!params.projectId || !params.path || !params.methodRequest) {
      return {
        success: false,
        status: 400,
        code: 'BAD_REQUEST',
        message: "Must provide either 'requestScenarioId' OR ('projectId', 'path', and 'methodRequest')",
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

    const reqScenarios = await prisma.requestScenario.findMany({
      where: { apiId: api.id, deletedAt: null },
      select: { id: true },
    });

    requestScenarioIds = reqScenarios.map((r) => r.id);
  }

  if (requestScenarioIds.length === 0) {
    return {
      success: true,
      status: 200,
      data: [],
    };
  }

  const rows = await prisma.responseScenario.findMany({
    where: {
      requestScenarioId: { in: requestScenarioIds },
      deletedAt: null,
    },
    orderBy: { priority: 'desc' },
  });

  const formattedData = rows.map((row) => ({
    id: row.id,
    requestScenarioId: row.requestScenarioId,
    name: row.name,
    description: row.description,
    statusCode: row.statusCode,
    headers: row.headers,
    body: row.body,
    responseType: row.responseType,
    filePath: row.filePath,
    fileName: row.fileName,
    delayMs: row.delayMs,
    weight: row.weight,
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
