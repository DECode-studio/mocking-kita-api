import { NextResponse } from 'next/server';
import { exportProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import { jsonFail, logServerError } from '@/src/core/server/http/responses';
import { ProjectParamsSchema } from './openapi.schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsedParams = ProjectParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonFail('Invalid project id', 400, 'INVALID_PROJECT_ID');
    }

    const projectId = parsedParams.data.id;
    const openApiSpec = await exportProjectOpenApi(projectId);

    return new NextResponse(JSON.stringify(openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="openapi-${projectId}.json"`,
      },
    });
  } catch (error) {
    logServerError('OpenAPI export failed', error);
    return jsonFail('Failed to export OpenAPI spec', 500, 'OPENAPI_EXPORT_FAILED');
  }
}
