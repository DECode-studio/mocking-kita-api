import * as fs from 'node:fs';
import * as path from 'node:path';
import { getStoredUploadPath, getUploadDirectory } from './upload.paths';

export type StoredUpload = {
  filePath: string;
  storedFileName: string;
};

export async function storeUploadFile(storedFileName: string, buffer: Buffer): Promise<StoredUpload> {
  const uploadsDir = getUploadDirectory();
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const relativeFilePath = getStoredUploadPath(storedFileName);
  const absoluteFilePath = path.resolve(/*turbopackIgnore: true*/ uploadsDir, storedFileName);

  await fs.promises.writeFile(absoluteFilePath, buffer, { flag: 'wx' });

  return {
    filePath: relativeFilePath,
    storedFileName,
  };
}
