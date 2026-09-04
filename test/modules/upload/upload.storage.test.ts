import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { storeUploadFile } from '@/src/modules/upload/upload.storage';

vi.mock('node:fs', () => {
  const mkdir = vi.fn().mockResolvedValue(undefined);
  const writeFile = vi.fn().mockResolvedValue(undefined);
  const promises = { mkdir, writeFile };
  return {
    default: { promises },
    promises,
  };
});

describe('upload storage', () => {
  const originalUploadPath = process.env.UPLOAD_PATH;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPLOAD_PATH = originalUploadPath;
  });

  it('creates the upload directory before writing the file', async () => {
    process.env.UPLOAD_PATH = '.data/uploads';

    await storeUploadFile('sample.pdf', Buffer.from('file'));

    expect(fs.promises.mkdir).toHaveBeenCalledWith(path.resolve(process.cwd(), '.data/uploads'), {
      recursive: true,
    });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), '.data/uploads/sample.pdf'),
      expect.any(Buffer),
      { flag: 'wx' }
    );
  });

  it('treats root-relative dot upload paths as project-relative paths', async () => {
    process.env.UPLOAD_PATH = '/.data/uploads';

    const result = await storeUploadFile('sample.pdf', Buffer.from('file'));

    expect(fs.promises.mkdir).toHaveBeenCalledWith(path.resolve(process.cwd(), '.data/uploads'), {
      recursive: true,
    });
    expect(result.filePath).toBe('.data/uploads/sample.pdf');
  });
});
