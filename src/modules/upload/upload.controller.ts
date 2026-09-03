import { NextRequest, NextResponse } from 'next/server';
import { UploadError } from './upload.errors';
import { uploadFile } from './upload.service';

export async function handleUploadRequest(request: NextRequest): Promise<NextResponse> {
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

    console.error('Upload failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        code: 'UPLOAD_FAILED',
      },
      { status: 500 }
    );
  }
}
