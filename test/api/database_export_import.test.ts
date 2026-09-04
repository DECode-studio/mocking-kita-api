import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as EXPORT_GET } from '@/src/app/api/database/export/route';
import { POST as IMPORT_POST } from '@/src/app/api/database/import/route';
import { readDatabase, importDatabaseData } from '@/src/core/db/database_storage_helper';
import { generateDatabaseSqlDump, importDatabaseSql } from '@/src/core/db/sql_database_storage_helper';
import { logChange } from '@/src/core/db/change_log_helper';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/core/db/database_storage_helper', () => ({
  readDatabase: vi.fn(),
  importDatabaseData: vi.fn(),
}));

vi.mock('@/src/core/db/sql_database_storage_helper', () => ({
  generateDatabaseSqlDump: vi.fn(),
  importDatabaseSql: vi.fn(),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
  getDatabaseSummary: vi.fn().mockResolvedValue({}),
}));

describe('/api/database/export & /api/database/import routes', () => {
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

  it('EXPORT_GET should return SQL dump by default', async () => {
    (generateDatabaseSqlDump as any).mockResolvedValue('CREATE TABLE test;');

    const req = new Request('http://localhost/api/database/export');
    const res = await EXPORT_GET(req);

    expect(res.headers.get('content-type')).toContain('application/sql');
    const text = await res.text();
    expect(text).toBe('CREATE TABLE test;');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT',
        entityType: 'database',
        metadata: expect.objectContaining({ format: 'sql' }),
      })
    );
  });

  it('EXPORT_GET should return 403 Forbidden when non-admin or no session', async () => {
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const req = new Request('http://localhost/api/database/export');
    const res = await EXPORT_GET(req);
    expect(res.status).toBe(403);
  });

  it('EXPORT_GET should return JSON format when requested', async () => {
    const mockDb = { version: '1.0.0', projects: [] };
    (readDatabase as any).mockResolvedValue(mockDb);

    const req = new Request('http://localhost/api/database/export?format=json');
    const res = await EXPORT_GET(req);

    expect(res.headers.get('content-type')).toContain('application/json');
    const json = await res.json();
    expect(json).toEqual(mockDb);
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT',
        entityType: 'database',
        metadata: expect.objectContaining({ format: 'json' }),
      })
    );
  });

  it('IMPORT_POST should return 400 when file is missing in formData', async () => {
    const req = {
      formData: vi.fn().mockResolvedValue(new Map()),
    } as unknown as Request;

    const res = await IMPORT_POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing import file');
  });

  it('IMPORT_POST with .sql file should invoke importDatabaseSql', async () => {
    (importDatabaseSql as any).mockResolvedValue({ statementsExecuted: 5, chunksExecuted: 1 });
    const file = new File(['CREATE TABLE t;'], 'backup.sql', { type: 'application/sql' });
    file.text = vi.fn().mockResolvedValue('CREATE TABLE t;');

    const formDataMap = new Map();
    formDataMap.set('file', file);
    formDataMap.set('mode', 'merge');

    const req = {
      formData: vi.fn().mockResolvedValue(formDataMap),
    } as unknown as Request;

    const res = await IMPORT_POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(importDatabaseSql).toHaveBeenCalledWith('CREATE TABLE t;', 'merge');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'IMPORT',
        entityType: 'database',
        metadata: expect.objectContaining({ format: 'sql', mode: 'merge' }),
      })
    );
  });

  it('IMPORT_POST with valid .json file should invoke importDatabaseData', async () => {
    const mockDb = {
      version: '1.0.0',
      projects: [],
      environments: [],
      collections: [],
      apiCollections: [],
      apiEnvironments: [],
      requestScenarios: [],
      responseScenarios: [],
    };
    (importDatabaseData as any).mockResolvedValue({ success: true });
    const fileStr = JSON.stringify(mockDb);
    const file = new File([fileStr], 'backup.json', { type: 'application/json' });
    file.text = vi.fn().mockResolvedValue(fileStr);

    const formDataMap = new Map();
    formDataMap.set('file', file);
    formDataMap.set('mode', 'replace');

    const req = {
      formData: vi.fn().mockResolvedValue(formDataMap),
    } as unknown as Request;

    const res = await IMPORT_POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(importDatabaseData).toHaveBeenCalledWith(expect.anything(), 'replace');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'IMPORT',
        entityType: 'database',
        metadata: expect.objectContaining({ format: 'json', mode: 'replace' }),
      })
    );
  });
});
