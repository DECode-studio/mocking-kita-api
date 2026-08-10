import { NextResponse } from 'next/server';
import { importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { clearInternalProxyCache } from '@/src/app/api/internal-proxy-cache';

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

    const result = importProjectOpenApi(projectId, openApiJson, mode);
    clearInternalProxyCache();

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
