import * as path from 'node:path';
import { ENV } from '@/src/core/constants/env';

export function normalizeUploadPath(uploadPath = ENV.UPLOAD_PATH): string {
  const trimmed = uploadPath.trim();
  if (!trimmed) return '.data/uploads';

  if (trimmed.startsWith('/.')) {
    return trimmed.slice(1);
  }

  return trimmed.replace(/\/+$/, '') || trimmed;
}

export function getUploadDirectory(uploadPath = ENV.UPLOAD_PATH): string {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), normalizeUploadPath(uploadPath));
}

export function getStoredUploadPath(storedFileName: string, uploadPath = ENV.UPLOAD_PATH): string {
  return `${normalizeUploadPath(uploadPath)}/${storedFileName}`;
}
