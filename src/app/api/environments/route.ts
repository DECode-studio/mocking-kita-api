import { NextRequest } from 'next/server';
import { GET as listEnvironments, POST as createEnvironment } from '@/src/modules/environment/environment.controller';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listEnvironments(request);
}

export async function POST(request: NextRequest) {
  return createEnvironment(request);
}
