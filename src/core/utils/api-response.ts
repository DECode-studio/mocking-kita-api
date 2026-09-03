import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}

export function okNoContent(init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true }, init);
}

export function fail(error: string, status = 500, code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code ? { code } : {}),
    },
    { status }
  );
}
