import { NextResponse } from 'next/server';
import prisma from '@/src/core/db/prisma-client';
import { importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { logChange } from '@/src/core/db/change_log_helper';
import { getProjectById } from '@/src/modules/project';
import { requireAdminSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';
import { OpenApiImportSchema, ProjectParamsSchema } from './openapi.schema';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const parsedParams = ProjectParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonFail('Invalid project id', 400, 'INVALID_PROJECT_ID');
    }

    const parsedBody = OpenApiImportSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) {
      return jsonFail('Invalid OpenAPI import request', 400, 'INVALID_OPENAPI_IMPORT_REQUEST');
    }

    const projectId = parsedParams.data.id;
    const body = parsedBody.data;
    const mode = body.mode;
    const openApiJson = body.openApiJson || body;

    const project = await getProjectById(projectId);
    const beforeApiCount = await prisma.api.count({ where: { projectId } });

    const result = await importProjectOpenApi(projectId, openApiJson, mode);
    clearInternalProxyCache();

    const afterApiCount = await prisma.api.count({ where: { projectId } });

    await logChange({
      action: 'IMPORT',
      entityType: 'project',
      entityId: projectId,
      projectId: projectId,
      beforeState: { apiCount: beforeApiCount },
      afterState: { apiCount: afterApiCount },
      metadata: { mode, openApiImport: true },
      description: `Imported OpenAPI spec into project '${project?.name || projectId}' (mode: ${mode})`,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return jsonUnknownError('OpenAPI import failed', error, 'Failed to import OpenAPI spec', 'OPENAPI_IMPORT_FAILED');
  }
}
