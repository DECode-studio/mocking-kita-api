import * as fs from 'node:fs';
import * as path from 'node:path';
import { ENV } from '@/src/core/constants/env';

export type StoredUpload = {
  filePath: string;
  storedFileName: string;
};

export async function storeUploadFile(storedFileName: string, buffer: Buffer): Promise<StoredUpload> {
  const uploadPath = ENV.UPLOAD_PATH;
  const uploadsDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), uploadPath);
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const relativeFilePath = `${uploadPath}/${storedFileName}`;
  const absoluteFilePath = path.resolve(/*turbopackIgnore: true*/ uploadsDir, storedFileName);

  await fs.promises.writeFile(absoluteFilePath, buffer, { flag: 'wx' });

  return {
    filePath: relativeFilePath,
    storedFileName,
  };
}
