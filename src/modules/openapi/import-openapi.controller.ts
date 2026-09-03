import { NextResponse } from 'next/server';
import prisma from '@/src/core/db/prisma-client';
import { importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy';
import { logChange } from '@/src/core/db/change_log_helper';
import { getProjectById } from '@/src/modules/project';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const mode = (body.mode === 'replace' ? 'replace' : body.mode === 'merge' ? 'merge' : 'upsert') as 'upsert' | 'merge' | 'replace';
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to import OpenAPI spec' },
      { status: 400 }
    );
  }
}
