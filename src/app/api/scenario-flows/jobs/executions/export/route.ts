import { NextRequest } from 'next/server';
import { exportJobExecutionsHandler } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return exportJobExecutionsHandler(request);
}

