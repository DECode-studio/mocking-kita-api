import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as IMPORT_POST } from '@/src/app/api/projects/[id]/import-openapi/route';
import { importProjectMarkdown, importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import prisma from '@/src/core/db/prisma-client';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/core/db/openapi_storage_helper', () => ({
  exportProjectOpenApi: vi.fn(),
  importProjectOpenApi: vi.fn(),
  importProjectMarkdown: vi.fn(),
}));

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    api: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/src/server/project', () => ({
  getProjectById: vi.fn().mockResolvedValue({ id: 'p1', name: 'Test Project' }),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
}));

vi.mock('@/src/server/mock-proxy', () => ({
  clearInternalProxyCache: vi.fn(),
}));

describe('Project Markdown Import API route', () => {
  const adminSession = {
    username: 'admin',
    name: 'Admin',
    role: 'ADMIN',
    token: 'test-token',
    rememberMe: false,
    loginAt: '2026-09-03T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify(adminSession) }),
    });
  });

  it('IMPORT_POST should invoke importProjectMarkdown when format is confluence_markdown', async () => {
    const mockResult = { success: true, importedApiCount: 2, importedCollectionCount: 1 };
    (importProjectMarkdown as any).mockResolvedValue(mockResult);
    (prisma.api.count as any).mockResolvedValueOnce(0).mockResolvedValueOnce(2);

    const req = new Request('http://localhost/api/projects/p1/import-openapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'confluence_markdown',
        markdownText: '## Test\nPOST /v1/test',
        mode: 'upsert',
      }),
    });
    const params = Promise.resolve({ id: 'p1' });

    const res = await IMPORT_POST(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.importedApiCount).toBe(2);
    expect(importProjectMarkdown).toHaveBeenCalledWith('p1', '## Test\nPOST /v1/test', 'upsert');
  });

  it('IMPORT_POST should support batch markdownTexts', async () => {
    const mockResult = { success: true, importedApiCount: 3, importedCollectionCount: 2 };
    (importProjectMarkdown as any).mockResolvedValue(mockResult);
    (prisma.api.count as any).mockResolvedValueOnce(0).mockResolvedValueOnce(3);

    const req = new Request('http://localhost/api/projects/p1/import-openapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'confluence_markdown',
        markdownTexts: ['doc1', 'doc2'],
        mode: 'merge',
      }),
    });
    const params = Promise.resolve({ id: 'p1' });

    const res = await IMPORT_POST(req, { params });
    expect(res.status).toBe(200);
    expect(importProjectMarkdown).toHaveBeenCalledWith('p1', ['doc1', 'doc2'], 'merge');
  });
});

