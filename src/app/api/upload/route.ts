import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateId } from '@/src/core/utils/uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.resolve(process.cwd(), '.data/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueId = generateId();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFileName = `${uniqueId}-${sanitizedFileName}`;
    const relativeFilePath = `.data/uploads/${storedFileName}`;
    const absoluteFilePath = path.resolve(uploadsDir, storedFileName);

    fs.writeFileSync(absoluteFilePath, buffer);

    return NextResponse.json({
      success: true,
      filePath: relativeFilePath,
      fileName: file.name,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
