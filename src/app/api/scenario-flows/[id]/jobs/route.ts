import { NextRequest } from 'next/server';
import { listJobsHandler, createJobHandler } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return listJobsHandler(request, id);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return createJobHandler(request, id);
}
