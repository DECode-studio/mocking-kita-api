import { NextRequest } from 'next/server';
import {
  updateScenarioFlowStepRoute,
  deleteScenarioFlowStepRoute,
} from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; stepId: string }> }
) {
  return updateScenarioFlowStepRoute(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; stepId: string }> }
) {
  return deleteScenarioFlowStepRoute(request, context);
}
