import { NextRequest } from 'next/server';
import { addScenarioFlowStepRoute } from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return addScenarioFlowStepRoute(request, context);
}
