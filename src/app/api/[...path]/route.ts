import { NextRequest } from 'next/server';
import { handleInternalApiRequest } from '../internal-proxy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function POST(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleInternalApiRequest(request);
}

export async function HEAD(request: NextRequest) {
  return handleInternalApiRequest(request);
}
