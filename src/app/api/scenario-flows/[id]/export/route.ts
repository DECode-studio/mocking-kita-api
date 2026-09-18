import { NextRequest } from 'next/server';
import { exportScenarioFlowRoute } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return exportScenarioFlowRoute(request, context);
}
