import { NextRequest } from 'next/server';
import {
  listScenarioFlowsByProject,
  createScenarioFlowRoute,
} from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return listScenarioFlowsByProject(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return createScenarioFlowRoute(request, context);
}
