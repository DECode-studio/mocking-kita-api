import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInternalApiRequest, clearInternalProxyCache, proxyConfigCache, responseCache } from '@/src/modules/mock-proxy';
import { __mockProxyTestUtils } from '@/src/modules/mock-proxy/mock-proxy.service';
import { readDatabase } from '@/src/core/db/database_storage_helper';
import { NextRequest } from 'next/server';
import path from 'node:path';

vi.mock('@/src/core/db/database_storage_helper', () => ({
  readDatabase: vi.fn(),
}));

describe('internal-proxy and cache', () => {
  const originalUploadPath = process.env.UPLOAD_PATH;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env.UPLOAD_PATH = originalUploadPath;
    clearInternalProxyCache();
  });

  it('clearInternalProxyCache should empty response and proxy config caches', () => {
    responseCache.set('key-1', { status: 200, headers: {}, body: 'ok', expiresAt: Date.now() + 10000 });
    proxyConfigCache.set('config', { value: {}, expiresAt: Date.now() + 10000 });
    expect(responseCache.size).toBe(1);
    expect(proxyConfigCache.size).toBe(1);

    clearInternalProxyCache();

    expect(responseCache.size).toBe(0);
    expect(proxyConfigCache.size).toBe(0);
  });

  it('handleInternalApiRequest should return 404 if path does not match any mock API', async () => {
    (readDatabase as any).mockResolvedValue({
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [],
      apiEnvironments: [],
      requestScenarios: [],
      responseScenarios: [],
    });

    const req = new NextRequest('http://localhost/non-existent-endpoint');
    const res = await handleInternalApiRequest(req);

    expect(res.status).toBe(404);
  });

  it('handleInternalApiRequest should match API endpoint and return configured response scenario', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/users', methodRequest: 'GET', status: true },
      ],
      apiEnvironments: [{ id: 'ae1', apiId: 'a1', environmentId: 'env1', enabled: true }],
      requestScenarios: [
        { id: 'r1', apiId: 'a1', name: 'Req 1', headers: {}, queryParams: {}, pathParams: {}, body: {}, bodyType: 'JSON', matchType: 'EXACT', priority: 10, status: true },
      ],
      responseScenarios: [
        { id: 'res1', requestScenarioId: 'r1', name: '200 OK', statusCode: 200, headers: { 'X-Custom': 'Value' }, body: { users: ['Alice'] }, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const req = new NextRequest('http://localhost/users');
    const res = await handleInternalApiRequest(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ users: ['Alice'] });
  });

  it('handleInternalApiRequest should match API endpoint regardless of /api prefix', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/media/upload-stream', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        { id: 'r1', apiId: 'a1', name: 'Req 1', headers: {}, queryParams: {}, pathParams: {}, body: {}, bodyType: 'NONE', matchType: 'PARTIAL', priority: 10, status: true },
      ],
      responseScenarios: [
        { id: 'res1', requestScenarioId: 'r1', name: '200 OK', statusCode: 200, headers: {}, body: { code: 'PLT-MSP-200' }, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    // Test calling with /api/ prefix when DB path is /media/upload-stream
    const reqWithApi = new NextRequest('http://localhost/api/media/upload-stream', { method: 'POST' });
    const resWithApi = await handleInternalApiRequest(reqWithApi);
    expect(resWithApi.status).toBe(200);
    expect(await resWithApi.json()).toEqual({ code: 'PLT-MSP-200' });

    // Test calling without /api/ prefix when DB path is /media/upload-stream
    const reqWithoutApi = new NextRequest('http://localhost/media/upload-stream', { method: 'POST' });
    const resWithoutApi = await handleInternalApiRequest(reqWithoutApi);
    expect(resWithoutApi.status).toBe(200);
    expect(await resWithoutApi.json()).toEqual({ code: 'PLT-MSP-200' });
  });

  it('handleInternalApiRequest should match form-data containing binary file placeholder', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/media/upload-stream', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r1',
          apiId: 'a1',
          name: 'Req 1',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {
            file: { filename: '(binary_file_data)' },
            type: 'ktp',
            total_part: 0,
            reference_no: 'Ecommerce001',
            use_versioning: true,
          },
          bodyType: 'FORM_DATA',
          matchType: 'EXACT',
          priority: 10,
          status: true,
        },
      ],
      responseScenarios: [
        { id: 'res1', requestScenarioId: 'r1', name: '200 OK', statusCode: 200, headers: {}, body: { code: 'PLT-MSP-200' }, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const formData = new FormData();
    formData.append('file', new File(['content'], 'images.jpeg', { type: 'image/jpeg' }));
    formData.append('type', 'ktp');
    formData.append('total_part', '0');
    formData.append('reference_no', 'Ecommerce001');
    formData.append('use_versioning', 'true');

    const req = new NextRequest('http://localhost/media/upload-stream', {
      method: 'POST',
      body: formData,
    });

    const res = await handleInternalApiRequest(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: 'PLT-MSP-200' });
  });

  it('handleInternalApiRequest should sanitize blocked response headers from scenario config', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/users', methodRequest: 'GET', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        { id: 'r1', apiId: 'a1', name: 'Req 1', headers: {}, queryParams: {}, pathParams: {}, body: {}, bodyType: 'NONE', matchType: 'EXACT', priority: 10, status: true },
      ],
      responseScenarios: [
        {
          id: 'res1',
          requestScenarioId: 'r1',
          name: '200 OK',
          statusCode: 200,
          headers: { 'Set-Cookie': 'session=bad', 'Content-Length': '999', 'X-Safe': 'ok' },
          body: { users: ['Alice'] },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 10,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const req = new NextRequest('http://localhost/users');
    const res = await handleInternalApiRequest(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('content-length')).toBeNull();
    expect(res.headers.get('x-safe')).toBe('ok');
  });

  it('resolveSafeUploadPath should allow absolute paths inside configured upload directory', () => {
    const absoluteUploadDir = path.resolve(process.cwd(), '.data/uploads');
    process.env.UPLOAD_PATH = absoluteUploadDir;

    expect(__mockProxyTestUtils.resolveSafeUploadPath(path.join(absoluteUploadDir, 'sample.pdf'))).toBe(
      path.join(absoluteUploadDir, 'sample.pdf')
    );
  });

  it('resolveSafeUploadPath should reject absolute paths outside configured upload directory', () => {
    const absoluteUploadDir = path.resolve(process.cwd(), '.data/uploads');
    process.env.UPLOAD_PATH = absoluteUploadDir;

    expect(__mockProxyTestUtils.resolveSafeUploadPath(path.resolve(process.cwd(), '.env'))).toBeNull();
  });

  it('handleInternalApiRequest should reuse proxy config cache across non-cacheable requests', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/submit', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        { id: 'r1', apiId: 'a1', name: 'Req 1', headers: {}, queryParams: {}, pathParams: {}, body: {}, bodyType: 'NONE', matchType: 'EXACT', priority: 10, status: true },
      ],
      responseScenarios: [
        { id: 'res1', requestScenarioId: 'r1', name: '200 OK', statusCode: 200, headers: {}, body: { ok: true }, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const first = await handleInternalApiRequest(new NextRequest('http://localhost/submit', { method: 'POST' }));
    const second = await handleInternalApiRequest(new NextRequest('http://localhost/submit', { method: 'POST' }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(readDatabase).toHaveBeenCalledTimes(1);
  });

  it('handleInternalApiRequest should return 404 if request does not match scenario headers or query params', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/api/v1/data', methodRequest: 'GET', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r1',
          apiId: 'a1',
          name: 'Authorized Scenario',
          headers: { 'x-api-key': 'secret-123' },
          queryParams: { role: 'admin' },
          pathParams: {},
          body: {},
          bodyType: 'NONE',
          matchType: 'EXACT',
          priority: 10,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res1',
          requestScenarioId: 'r1',
          name: '200 OK',
          statusCode: 200,
          headers: {},
          body: { message: 'success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 10,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    // Request without headers/query params -> Should NOT match and should return 404
    const reqWithoutHeaderParam = new NextRequest('http://localhost/api/v1/data', { method: 'GET' });
    const resWithout = await handleInternalApiRequest(reqWithoutHeaderParam);
    expect(resWithout.status).toBe(404);
    const errJson = await resWithout.json();
    expect(errJson.error).toBe('No request scenario matched this request');

    // Request with correct headers and query params -> Should match and return 200
    const reqWithHeaderParam = new NextRequest('http://localhost/api/v1/data?role=admin', {
      method: 'GET',
      headers: { 'x-api-key': 'secret-123' },
    });
    const resWith = await handleInternalApiRequest(reqWithHeaderParam);
    expect(resWith.status).toBe(200);
    const successJson = await resWith.json();
    expect(successJson).toEqual({ message: 'success' });
  });
});

