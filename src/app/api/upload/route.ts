import { NextRequest } from 'next/server';
import { handleUploadRequest } from '@/src/modules/upload';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleUploadRequest(request);
}
