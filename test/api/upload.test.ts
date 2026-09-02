import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/src/app/api/upload/route';
import { NextRequest } from 'next/server';
import fs from 'node:fs';

vi.mock('node:fs', () => {
  const writeFileSync = vi.fn();
  const existsSync = vi.fn().mockReturnValue(true);
  const mkdirSync = vi.fn();
  return {
    default: { existsSync, mkdirSync, writeFileSync },
    existsSync,
    mkdirSync,
    writeFileSync,
  };
});

describe('/api/upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST should return 400 when file is missing in formData', async () => {
    const req = {
      formData: vi.fn().mockResolvedValue(new Map()),
    } as unknown as NextRequest;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('No file provided');
  });

  it('POST should save uploaded file and return filePath', async () => {
    const file = new File(['sample content'], 'test.png', { type: 'image/png' });
    file.arrayBuffer = vi.fn().mockResolvedValue(new TextEncoder().encode('sample content').buffer);

    const formDataMap = new Map();
    formDataMap.set('file', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formDataMap),
    } as unknown as NextRequest;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.fileName).toBe('test.png');
    expect(json.filePath).toContain('.data/uploads/');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
