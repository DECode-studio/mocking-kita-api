import { NextRequest } from 'next/server';
import { getApiEnvironmentRoute } from '@/src/modules/api/api.controller';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; environmentId: string }> }) {
  const params = await context.params;
  return getApiEnvironmentRoute(request, {
    params: Promise.resolve({ apiId: params.id, environmentId: params.environmentId }),
  });
}
