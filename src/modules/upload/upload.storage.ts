import * as fs from 'node:fs';
import * as path from 'node:path';

export type StoredUpload = {
  filePath: string;
  storedFileName: string;
};

export async function storeUploadFile(storedFileName: string, buffer: Buffer): Promise<StoredUpload> {
  const uploadsDir = path.resolve(process.cwd(), '.data/uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const relativeFilePath = `.data/uploads/${storedFileName}`;
  const absoluteFilePath = path.resolve(uploadsDir, storedFileName);

  await fs.promises.writeFile(absoluteFilePath, buffer, { flag: 'wx' });

  return {
    filePath: relativeFilePath,
    storedFileName,
  };
}
