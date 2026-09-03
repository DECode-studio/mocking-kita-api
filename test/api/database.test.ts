import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/src/app/api/database/route';
import { readDatabase, wipeAllDatabaseData } from '@/src/core/db/database_storage_helper';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/core/db/database_storage_helper', () => ({
  readDatabase: vi.fn(),
  resetDatabaseToSeed: vi.fn(),
  wipeAllDatabaseData: vi.fn(),
  importDatabaseData: vi.fn(),
  seedDatabase: vi.fn(),
}));

vi.mock('@/src/modules/project', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  softDeleteProject: vi.fn(),
  restoreProject: vi.fn(),
  hardDeleteProject: vi.fn(),
  getProjectById: vi.fn(),
}));

vi.mock('@/src/modules/environment', () => ({
  createEnvironment: vi.fn(),
  updateEnvironment: vi.fn(),
  softDeleteEnvironment: vi.fn(),
  getEnvironmentById: vi.fn(),
}));

vi.mock('@/src/modules/api', () => ({
  createApi: vi.fn(),
  updateApi: vi.fn(),
  softDeleteApi: vi.fn(),
  getApiById: vi.fn(),
  upsertApiEnvironment: vi.fn(),
}));

vi.mock('@/src/modules/collection', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  softDeleteCollection: vi.fn(),
  getCollectionById: vi.fn(),
}));

vi.mock('@/src/modules/request-scenario', () => ({
  createRequestScenario: vi.fn(),
  updateRequestScenario: vi.fn(),
  softDeleteRequestScenario: vi.fn(),
  getRequestScenarioById: vi.fn(),
}));

vi.mock('@/src/modules/response-scenario', () => ({
  createResponseScenario: vi.fn(),
  updateResponseScenario: vi.fn(),
  softDeleteResponseScenario: vi.fn(),
  getResponseScenarioById: vi.fn(),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
  getDatabaseSummary: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/src/modules/mock-proxy', () => ({
  clearInternalProxyCache: vi.fn(),
}));

describe('/api/database route', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = { get: vi.fn() };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('GET should return database snapshot', async () => {
    const mockDb = { version: '1.0.0', projects: [] };
    (readDatabase as any).mockResolvedValue(mockDb);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(mockDb);
  });

  it('POST with getDatabase action should return database snapshot', async () => {
    const mockDb = { version: '1.0.0', projects: [] };
    (readDatabase as any).mockResolvedValue(mockDb);

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'getDatabase' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(mockDb);
  });

  it('POST with resetDatabase action should return 403 for unauthorized role', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify({ role: 'Guest' }) });

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'resetDatabase' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Forbidden');
  });

  it('POST with resetDatabase action should succeed for Admin role', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify({ role: 'Admin' }) });
    (wipeAllDatabaseData as any).mockResolvedValue({ wiped: true });

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'resetDatabase' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(wipeAllDatabaseData).toHaveBeenCalled();
  });

  it('POST with unknown action should return 400', async () => {
    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknownAction' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Unknown database action');
  });
});
