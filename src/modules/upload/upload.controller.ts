import { NextRequest, NextResponse } from 'next/server';
import { UploadError } from './upload.errors';
import { uploadFile } from './upload.service';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { checkRateLimit, getRequestRateLimitKey } from '@/src/core/server/security/rate-limit';

export async function handleUploadRequest(request: NextRequest): Promise<NextResponse> {
  const rateLimit = checkRateLimit(getRequestRateLimitKey(request, 'upload'), 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many upload requests', code: 'UPLOAD_RATE_LIMITED' },
      { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds ?? 1) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const result = await uploadFile(file);

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    return jsonUnknownError('Upload failed', error, 'Upload failed', 'UPLOAD_FAILED');
  }
}
