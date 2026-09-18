import { NextRequest } from 'next/server';
import {
  listAllScenarioFlows,
  createGlobalScenarioFlow,
} from '@/src/server/scenario-flow';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listAllScenarioFlows(request);
}

export async function POST(request: NextRequest) {
  return createGlobalScenarioFlow(request);
}
