import { NextRequest, NextResponse } from 'next/server';
import { verifyExternalAuth } from '@/src/server/external/external-auth.middleware';
import { listExternalResponseScenarios } from '@/src/server/external/external-response-scenario.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await verifyExternalAuth(request);
  if (!auth.authenticated) {
    return auth.response!;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const requestScenarioId = searchParams.get('requestScenarioId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const path = searchParams.get('path') || undefined;
    const methodRequest = searchParams.get('methodRequest') || searchParams.get('method') || undefined;

    const result = await listExternalResponseScenarios({
      requestScenarioId,
      projectId,
      path,
      methodRequest,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'An internal server error occurred',
        },
      },
      { status: 500 }
    );
  }
}
