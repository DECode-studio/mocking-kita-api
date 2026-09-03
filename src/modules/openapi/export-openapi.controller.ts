import { NextResponse } from 'next/server';
import { exportProjectOpenApi } from '@/src/core/db/openapi_storage_helper';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const openApiSpec = exportProjectOpenApi(projectId);

    return new NextResponse(JSON.stringify(openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="openapi-${projectId}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to export OpenAPI spec' },
      { status: 400 }
    );
  }
}
