import { NextRequest } from 'next/server';
import { listJobsHandler, createJobHandler } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listJobsHandler(request);
}

export async function POST(request: NextRequest) {
  return createJobHandler(request);
}
