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

vi.mock('@/src/data/project/data_source/project_data_source_impl', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  softDeleteProject: vi.fn(),
  restoreProject: vi.fn(),
  hardDeleteProject: vi.fn(),
  getProjectById: vi.fn(),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
  getDatabaseSummary: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/src/app/api/internal-proxy-cache', () => ({
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
