import { NextRequest } from 'next/server';
import { reorderScenarioFlowStepsRoute } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return reorderScenarioFlowStepsRoute(request, context);
}
