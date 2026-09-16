import { NextRequest, NextResponse } from 'next/server';
import { verifyExternalAuth } from '@/src/server/external/external-auth.middleware';
import { upsertExternalOpenApi } from '@/src/server/external/external-openapi.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await verifyExternalAuth(request);
  if (!auth.authenticated) {
    return auth.response!;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await upsertExternalOpenApi(body);

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

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.data,
      },
      { status: result.status }
    );
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
