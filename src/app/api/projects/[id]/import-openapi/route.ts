import { NextResponse } from 'next/server';
import { importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { clearInternalProxyCache } from '@/src/app/api/internal-proxy-cache';
import { logChange } from '@/src/core/db/change_log_helper';
import { getProjectById } from '@/src/data/project/data_source/project_data_source_impl';
import { db } from '@/src/core/db/sqlite-client';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const mode = (body.mode === 'replace' ? 'replace' : 'merge') as 'replace' | 'merge';
    const openApiJson = body.openApiJson || body;

    const project = getProjectById(projectId);
    const beforeApis = db.prepare('SELECT COUNT(*) as count FROM tblApi WHERE project_id = ?').get(projectId) as { count: number };

    const result = importProjectOpenApi(projectId, openApiJson, mode);
    clearInternalProxyCache();

    const afterApis = db.prepare('SELECT COUNT(*) as count FROM tblApi WHERE project_id = ?').get(projectId) as { count: number };

    await logChange({
      action: 'IMPORT',
      entityType: 'project',
      entityId: projectId,
      projectId: projectId,
      beforeState: { apiCount: beforeApis?.count || 0 },
      afterState: { apiCount: afterApis?.count || 0 },
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
