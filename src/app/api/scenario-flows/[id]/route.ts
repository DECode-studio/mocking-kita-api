import { NextRequest } from 'next/server';
import {
  getScenarioFlowDetail,
  updateScenarioFlowRoute,
  deleteScenarioFlowRoute,
} from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getScenarioFlowDetail(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateScenarioFlowRoute(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return deleteScenarioFlowRoute(request, context);
}
