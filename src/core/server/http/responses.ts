import { NextResponse } from 'next/server';

export function jsonOk<T extends Record<string, unknown>>(body: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, init);
}

export function jsonFail(error: string, status = 500, code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code ? { code } : {}),
    },
    { status }
  );
}

export function logServerError(scope: string, error: unknown): void {
  console.error(scope, error);
}

export function jsonUnknownError(scope: string, error: unknown, message = 'Internal server error', code = 'INTERNAL_ERROR'): NextResponse {
  logServerError(scope, error);
  return jsonFail(message, 500, code);
}
