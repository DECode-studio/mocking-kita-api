import { NextRequest } from 'next/server';
import {
  getJobByIdHandler,
  updateJobHandler,
  deleteJobHandler,
} from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;
  return getJobByIdHandler(request, jobId);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;
  return updateJobHandler(request, jobId);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;
  return deleteJobHandler(request, jobId);
}
