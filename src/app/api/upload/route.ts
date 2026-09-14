import { NextRequest } from 'next/server';
import { handleUploadRequest } from '@/src/server/upload';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleUploadRequest(request);
}
