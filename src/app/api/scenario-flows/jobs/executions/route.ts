import { NextRequest } from 'next/server';
import { listJobExecutionsHandler } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listJobExecutionsHandler(request);
}

