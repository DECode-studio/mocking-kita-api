import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/src/app/api/database/route';
import { importDatabaseData, readDatabase, wipeAllDatabaseData } from '@/src/core/db/database_storage_helper';
import { createProject, getAllProjects, getProjectById, updateProject } from '@/src/modules/project';
import { createApi, getApiById } from '@/src/modules/api';
import { cookies } from 'next/headers';
import { getDashboardSummary } from '@/src/modules/database/database-dashboard-summary.service';

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
  getAllProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  softDeleteProject: vi.fn(),
  restoreProject: vi.fn(),
  hardDeleteProject: vi.fn(),
  getProjectById: vi.fn(),
}));

vi.mock('@/src/modules/environment', () => ({
  getAllEnvironments: vi.fn(),
  createEnvironment: vi.fn(),
  updateEnvironment: vi.fn(),
  softDeleteEnvironment: vi.fn(),
  getEnvironmentById: vi.fn(),
}));

vi.mock('@/src/modules/api', () => ({
  getAllApis: vi.fn(),
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

vi.mock('@/src/modules/database/database-dashboard-summary.service', () => ({
  getDashboardSummary: vi.fn(),
}));

describe('/api/database route', () => {
  let mockCookieStore: any;
  const adminSession = {
    username: 'admin',
    name: 'Admin',
    role: 'Admin',
    token: 'test-token',
    rememberMe: false,
    loginAt: '2026-09-03T00:00:00.000Z',
  };

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

  it('POST with listProjects action should return only project list payload', async () => {
    vi.mocked(readDatabase).mockClear();
    const projects = [{ id: 'p1', name: 'Project One', status: true }];
    (getAllProjects as any).mockResolvedValue(projects);

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'listProjects' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(projects);
    expect(getAllProjects).toHaveBeenCalled();
    expect(readDatabase).not.toHaveBeenCalled();
  });

  it('POST with getDashboardSummary action should return compact dashboard payload', async () => {
    vi.mocked(readDatabase).mockClear();
    const summary = {
      projectCount: 1,
      activeProjectCount: 1,
      environmentCount: 0,
      endpointCount: 2,
      activeEndpointCount: 2,
      requestScenarioCount: 1,
      responseScenarioCount: 1,
      methodCounts: { GET: 2 },
      recentProjects: [],
      configuredEndpoints: [],
    };
    (getDashboardSummary as any).mockResolvedValue(summary);

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'getDashboardSummary' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(summary);
    expect(getDashboardSummary).toHaveBeenCalled();
    expect(readDatabase).not.toHaveBeenCalled();
  });

  it('POST with getProjectById action should return only requested project payload', async () => {
    vi.mocked(readDatabase).mockClear();
    const project = { id: 'p1', name: 'Project One', status: true };
    (getProjectById as any).mockResolvedValue(project);

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'getProjectById', payload: { id: 'p1' } }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(project);
    expect(getProjectById).toHaveBeenCalledWith('p1');
    expect(readDatabase).not.toHaveBeenCalled();
  });

  it('POST with resetDatabase action should return 403 for unauthorized role', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify({ ...adminSession, role: 'Guest' }) });

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
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });
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

  it('POST with importDatabase action should validate mode and require privileged session', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });
    (importDatabaseData as any).mockResolvedValue({ imported: true });

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'importDatabase', payload: { data: { version: '1.0.0' }, mode: 'merge' } }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ imported: true });
    expect(importDatabaseData).toHaveBeenCalledWith({ version: '1.0.0' }, 'merge');
  });

  it('POST with invalid importDatabase mode should return safe validation error', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });

    const req = new Request('http://localhost/api/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'importDatabase', payload: { data: {}, mode: 'drop' } }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid database action request');
  });

  it('POST should dispatch project and API actions through granular handlers', async () => {
    (createProject as any).mockResolvedValue({ id: 'p1', name: 'Project One' });
    (updateProject as any).mockResolvedValue({ id: 'p1', name: 'Project One Updated' });
    (createApi as any).mockResolvedValue({ id: 'api1', projectId: 'p1', name: 'List Users', methodRequest: 'GET', path: '/users' });
    (getApiById as any).mockResolvedValue({ id: 'api1', projectId: 'p1', name: 'List Users' });

    const createProjectResponse = await POST(
      new Request('http://localhost/api/database', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', payload: { name: 'Project One' } }),
      })
    );
    const updateProjectResponse = await POST(
      new Request('http://localhost/api/database', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', payload: { id: 'p1', input: { name: 'Project One Updated' } } }),
      })
    );
    const createApiResponse = await POST(
      new Request('http://localhost/api/database', {
        method: 'POST',
        body: JSON.stringify({ action: 'createApi', payload: { projectId: 'p1', name: 'List Users', methodRequest: 'GET', path: '/users' } }),
      })
    );

    expect(createProjectResponse.status).toBe(200);
    expect(updateProjectResponse.status).toBe(200);
    expect(createApiResponse.status).toBe(200);
    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String), name: 'Project One' }));
    expect(updateProject).toHaveBeenCalledWith('p1', { name: 'Project One Updated' });
    expect(createApi).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String), projectId: 'p1', name: 'List Users' }));
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
