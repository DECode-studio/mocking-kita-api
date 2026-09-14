import { describe, expect, it, vi } from 'vitest';
import { sanitizeFileName, uploadFile, UploadError } from '@/src/server/upload';

describe('upload service', () => {
  it('sanitizes file names before storage', () => {
    expect(sanitizeFileName('../unsafe file.png')).toBe('unsafe_file.png');
    expect(sanitizeFileName('invoice#1.pdf')).toBe('invoice_1.pdf');
  });

  it('stores accepted files with a sanitized generated name', async () => {
    const file = new File(['sample content'], '../sample report.png', { type: 'image/png' });
    const storage = vi.fn().mockResolvedValue({
      filePath: '.data/uploads/generated-sample_report.png',
      storedFileName: 'generated-sample_report.png',
    });

    const result = await uploadFile(file, storage);

    expect(result.fileName).toBe('../sample report.png');
    expect(result.filePath).toBe('.data/uploads/generated-sample_report.png');
    expect(storage).toHaveBeenCalledTimes(1);
    expect(storage.mock.calls[0][0]).toMatch(/^[a-z0-9-]+-sample_report\.png$/);
    expect(storage.mock.calls[0][1]).toBeInstanceOf(Buffer);
  });

  it('rejects missing files with a safe error', async () => {
    await expect(uploadFile(null)).rejects.toMatchObject({
      message: 'No file provided',
      status: 400,
      code: 'UPLOAD_FILE_REQUIRED',
    } satisfies Partial<UploadError>);
  });

  it('rejects unsupported file extensions', async () => {
    const file = new File(['sample content'], 'payload.exe', { type: 'application/octet-stream' });

    await expect(uploadFile(file)).rejects.toMatchObject({
      message: 'File type is not allowed',
      status: 415,
      code: 'UPLOAD_FILE_TYPE_NOT_ALLOWED',
    } satisfies Partial<UploadError>);
  });
});
