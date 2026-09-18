import { NextRequest } from 'next/server';
import { importScenarioFlowGlobalRoute } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return importScenarioFlowGlobalRoute(request);
}
