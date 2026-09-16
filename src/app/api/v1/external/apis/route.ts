import { NextRequest, NextResponse } from 'next/server';
import { verifyExternalAuth } from '@/src/server/external/external-auth.middleware';
import { listExternalApis } from '@/src/server/external/external-api.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await verifyExternalAuth(request);
  if (!auth.authenticated) {
    return auth.response!;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId') || '';
    const collectionId = searchParams.get('collectionId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const result = await listExternalApis({
      projectId,
      collectionId,
      search,
      page,
      limit,
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
      pagination: result.pagination,
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
