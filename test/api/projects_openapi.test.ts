import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as EXPORT_GET } from '@/src/app/api/projects/[id]/export-openapi/route';
import { POST as IMPORT_POST } from '@/src/app/api/projects/[id]/import-openapi/route';
import { exportProjectOpenApi, importProjectOpenApi } from '@/src/core/db/openapi_storage_helper';
import prisma from '@/src/core/db/prisma-client';

vi.mock('@/src/core/db/openapi_storage_helper', () => ({
  exportProjectOpenApi: vi.fn(),
  importProjectOpenApi: vi.fn(),
}));

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    api: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/src/modules/project', () => ({
  getProjectById: vi.fn().mockResolvedValue({ id: 'p1', name: 'Test Project' }),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
}));

vi.mock('@/src/modules/mock-proxy', () => ({
  clearInternalProxyCache: vi.fn(),
}));

describe('OpenAPI Export & Import API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('EXPORT_GET should return OpenAPI JSON spec Attachment', async () => {
    const mockSpec = { openapi: '3.0.0', info: { title: 'Test' } };
    (exportProjectOpenApi as any).mockReturnValue(mockSpec);

    const req = new Request('http://localhost/api/projects/p1/export-openapi');
    const params = Promise.resolve({ id: 'p1' });

    const res = await EXPORT_GET(req, { params });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const json = await res.json();
    expect(json).toEqual(mockSpec);
    expect(exportProjectOpenApi).toHaveBeenCalledWith('p1');
  });

  it('IMPORT_POST should import OpenAPI spec and return result', async () => {
    (importProjectOpenApi as any).mockResolvedValue({ success: true, importedApiCount: 2, importedCollectionCount: 1 });
    (prisma.api.count as any).mockResolvedValue(0);

    const req = new Request('http://localhost/api/projects/p1/import-openapi', {
      method: 'POST',
      body: JSON.stringify({ openApiJson: { openapi: '3.0.0' }, mode: 'upsert' }),
    });
    const params = Promise.resolve({ id: 'p1' });

    const res = await IMPORT_POST(req, { params });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.importedApiCount).toBe(2);
    expect(importProjectOpenApi).toHaveBeenCalledWith('p1', { openapi: '3.0.0' }, 'upsert');
  });
});
