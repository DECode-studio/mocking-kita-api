import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function POST(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function PUT(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function PATCH(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}

export async function HEAD(request: NextRequest) {
  const { handleInternalApiRequest } = await import('./internal-proxy');
  return handleInternalApiRequest(request);
}
