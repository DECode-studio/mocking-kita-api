import { NextRequest } from 'next/server';
import { GET as listApis, POST as createApi } from '@/src/server/api/api.controller';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return listApis(request);
}

export async function POST(request: NextRequest) {
  return createApi(request);
}
