import { NextRequest, NextResponse } from 'next/server';
import { externalSignIn } from '@/src/server/external/external-auth.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await externalSignIn(body);

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
      message: 'Authentication successful',
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
