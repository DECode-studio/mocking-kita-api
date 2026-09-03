import * as path from 'node:path';
import { generateId } from '@/src/core/utils/uuid';
import { ALLOWED_FILE_EXTENSIONS, MAX_UPLOAD_BYTES } from './upload.schema';
import { storeUploadFile, type StoredUpload } from './upload.storage';
import { UploadError } from './upload.errors';

export type UploadResult = {
  filePath: string;
  fileName: string;
  storedFileName: string;
};

type UploadStorage = (storedFileName: string, buffer: Buffer) => Promise<StoredUpload>;

export function sanitizeFileName(fileName: string): string {
  const baseName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, '_');
  return baseName || 'upload.bin';
}

export async function uploadFile(file: File | null, storage: UploadStorage = storeUploadFile): Promise<UploadResult> {
  if (!file) {
    throw new UploadError('No file provided', 400, 'UPLOAD_FILE_REQUIRED');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('File is too large', 413, 'UPLOAD_FILE_TOO_LARGE');
  }

  const sanitizedFileName = sanitizeFileName(file.name);
  const fileExt = path.extname(sanitizedFileName).toLowerCase();

  if (!ALLOWED_FILE_EXTENSIONS.has(fileExt)) {
    throw new UploadError('File type is not allowed', 415, 'UPLOAD_FILE_TYPE_NOT_ALLOWED');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const storedFileName = `${generateId()}-${sanitizedFileName}`;
  const storedUpload = await storage(storedFileName, buffer);

  return {
    filePath: storedUpload.filePath,
    fileName: file.name,
    storedFileName: storedUpload.storedFileName,
  };
}
