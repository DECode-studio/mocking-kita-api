import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInternalApiRequest } from '@/src/app/api/internal-proxy';
import { clearInternalProxyCache, responseCache } from '@/src/app/api/internal-proxy-cache';
import { readDatabase } from '@/src/core/db/database_storage_helper';
import { NextRequest } from 'next/server';

vi.mock('@/src/core/db/database_storage_helper', () => ({
  readDatabase: vi.fn(),
}));

describe('internal-proxy and cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearInternalProxyCache();
  });

  it('clearInternalProxyCache should empty responseCache Map', () => {
    responseCache.set('key-1', { status: 200, headers: {}, body: 'ok', expiresAt: Date.now() + 10000 });
    expect(responseCache.size).toBe(1);

    clearInternalProxyCache();

    expect(responseCache.size).toBe(0);
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
});
