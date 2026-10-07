import { NextRequest } from 'next/server';
import { runNowJobHandler } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;
  return runNowJobHandler(request, jobId);
}
