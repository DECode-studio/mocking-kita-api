import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInternalApiRequest, clearInternalProxyCache, proxyConfigCache, responseCache } from '@/src/server/mock-proxy';
import { __mockProxyTestUtils } from '@/src/server/mock-proxy/mock-proxy.service';
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

  it('handleInternalApiRequest should match complex deep nested body with param rule objects', async () => {
    clearInternalProxyCache();
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: '8f68c54a-a92f-40e1-b337-e00461806e51', projectId: 'p1', path: '/api/tech/job', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r1',
          apiId: '8f68c54a-a92f-40e1-b337-e00461806e51',
          name: 'Post Normal',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {
            '1_level': {
              status_aktif: { value: true, enabled: true, operator: 'equal' },
              jumlah_karyawan: 150,
            },
            '2_level': {
              divisi_teknologi: {
                ruangan: 'Lantai 4',
                kepala_divisi: 'Budi Santoso',
              },
            },
            '3_level': {
              infrastruktur: {
                server_utama: {
                  lokasi: 'Data Center Jakarta',
                  kapasitas_gb: 1024,
                },
              },
            },
            perusahaan: 'Tech Innovation Asia',
            array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
            json_in_array: [
              {
                status: 'In Progress',
                id_proyek: 'P-01',
                nama_proyek: 'Pengembangan Mobile App',
              },
              {
                status: 'Completed',
                id_proyek: 'P-02',
                nama_proyek: 'Migrasi Cloud',
              },
            ],
          },
          bodyType: 'JSON',
          matchType: 'EXACT',
          matchStrategy: 'ALL',
          priority: 1,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res1',
          requestScenarioId: 'r1',
          name: 'Success Response',
          statusCode: 200,
          headers: {},
          body: { message: 'Success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 1,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const incomingPayload = {
      perusahaan: 'Tech Innovation Asia',
      '1_level': {
        status_aktif: {
          value: true,
          enabled: true,
          operator: 'equal',
        },
        jumlah_karyawan: 150,
      },
      '2_level': {
        divisi_teknologi: {
          kepala_divisi: 'Budi Santoso',
          ruangan: 'Lantai 4',
        },
      },
      '3_level': {
        infrastruktur: {
          server_utama: {
            lokasi: 'Data Center Jakarta',
            kapasitas_gb: 1024,
          },
        },
      },
      array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
      json_in_array: [
        {
          id_proyek: 'P-01',
          nama_proyek: 'Pengembangan Mobile App',
          status: 'In Progress',
        },
        {
          id_proyek: 'P-02',
          nama_proyek: 'Migrasi Cloud',
          status: 'Completed',
        },
      ],
    };

    const req = new NextRequest('http://localhost/api/tech/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(incomingPayload),
    });

    const res = await handleInternalApiRequest(req);
    expect(res.status).toBe(200);
    const bodyJson = await res.json();
    expect(bodyJson).toEqual({ message: 'Success' });
  });

  it('handleInternalApiRequest should match body structure and validate only bodyRules values when bodyRules are defined', async () => {
    clearInternalProxyCache();
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: '8f68c54a-a92f-40e1-b337-e00461806e51', projectId: 'p1', path: '/api/tech/job', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r1',
          apiId: '8f68c54a-a92f-40e1-b337-e00461806e51',
          name: 'Post with Rules',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {
            '1_level': {
              status_aktif: {
                value: true,
                enabled: true,
                operator: 'equal',
              },
              jumlah_karyawan: 150,
            },
            '2_level': {
              divisi_teknologi: {
                ruangan: 'Lantai 4',
                kepala_divisi: 'Budi Santoso',
              },
            },
            '3_level': {
              infrastruktur: {
                server_utama: {
                  lokasi: 'Data Center Jakarta',
                  kapasitas_gb: 1024,
                },
              },
            },
            perusahaan: 'Tech Innovation Asia',
            array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
            json_in_array: [
              {
                status: 'In Progress',
                id_proyek: 'P-01',
                nama_proyek: 'Pengembangan Mobile App',
              },
              {
                status: 'Completed',
                id_proyek: 'P-02',
                nama_proyek: 'Migrasi Cloud',
              },
            ],
          },
          bodyRules: [
            {
              path: '1_level.jumlah_karyawan',
              operator: 'equal',
              value: 150,
              enabled: true,
            },
          ],
          bodyType: 'JSON',
          matchType: 'EXACT',
          matchStrategy: 'ALL',
          priority: 1,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res1',
          requestScenarioId: 'r1',
          name: 'Success Response',
          statusCode: 200,
          headers: {},
          body: { message: 'Success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 1,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    // 1. Incoming payload has status_aktif.value = false (different from template's true), but rules match (jumlah_karyawan = 150)
    const validIncomingPayload = {
      '1_level': {
        status_aktif: {
          value: false,
          enabled: true,
          operator: 'equal',
        },
        jumlah_karyawan: 150,
      },
      '2_level': {
        divisi_teknologi: {
          ruangan: 'Lantai 4',
          kepala_divisi: 'Budi Santoso',
        },
      },
      '3_level': {
        infrastruktur: {
          server_utama: {
            lokasi: 'Data Center Jakarta',
            kapasitas_gb: 1024,
          },
        },
      },
      perusahaan: 'Tech Innovation Asia',
      array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
      json_in_array: [
        {
          status: 'In Progress',
          id_proyek: 'P-01',
          nama_proyek: 'Pengembangan Mobile App',
        },
        {
          status: 'Completed',
          id_proyek: 'P-02',
          nama_proyek: 'Migrasi Cloud',
        },
      ],
    };

    const reqValid = new NextRequest('http://localhost/api/tech/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validIncomingPayload),
    });

    const resValid = await handleInternalApiRequest(reqValid);
    expect(resValid.status).toBe(200);
    expect(await resValid.json()).toEqual({ message: 'Success' });

    // 2. Incoming payload has wrong jumlah_karyawan (e.g. 200 instead of 150) -> Should NOT match (404)
    const invalidRulePayload = {
      ...validIncomingPayload,
      '1_level': {
        ...validIncomingPayload['1_level'],
        jumlah_karyawan: 200,
      },
    };

    const reqInvalidRule = new NextRequest('http://localhost/api/tech/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidRulePayload),
    });

    const resInvalidRule = await handleInternalApiRequest(reqInvalidRule);
    expect(resInvalidRule.status).toBe(404);

    // 3. Incoming payload is missing a required structure key (e.g. '3_level') -> Should NOT match (404)
    const { '3_level': _omitted, ...missingStructurePayload } = validIncomingPayload;
    const reqMissingStructure = new NextRequest('http://localhost/api/tech/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(missingStructurePayload),
    });

    const resMissingStructure = await handleInternalApiRequest(reqMissingStructure);
    expect(resMissingStructure.status).toBe(404);
  });

  it('handleInternalApiRequest should allow flexible body structure when strictBodyStructure is false as long as bodyRules match', async () => {
    clearInternalProxyCache();
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'api-flexible', projectId: 'p1', path: '/api/flexible/job', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r-flex',
          apiId: 'api-flexible',
          name: 'Flexible Body Scenario',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {
            '1_level': {
              status_aktif: { value: true, enabled: true, operator: 'equal' },
              jumlah_karyawan: 150,
            },
            '2_level': {
              divisi_teknologi: { ruangan: 'Lantai 4' },
            },
          },
          bodyRules: [
            {
              path: '1_level.jumlah_karyawan',
              operator: 'equal',
              value: 150,
              enabled: true,
            },
          ],
          strictBodyStructure: false, // Flexible structure
          bodyType: 'JSON',
          matchType: 'EXACT',
          matchStrategy: 'ALL',
          priority: 1,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res-flex',
          requestScenarioId: 'r-flex',
          name: 'Success Response',
          statusCode: 200,
          headers: {},
          body: { message: 'Flexible Success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 1,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    // 1. Incoming payload has completely different structure (no '2_level', no 'status_aktif'), but rule matches (1_level.jumlah_karyawan = 150)
    const flexiblePayload = {
      '1_level': {
        jumlah_karyawan: 150,
      },
      random_field: 'completely different structure',
    };

    const reqFlexible = new NextRequest('http://localhost/api/flexible/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(flexiblePayload),
    });

    const resFlexible = await handleInternalApiRequest(reqFlexible);
    expect(resFlexible.status).toBe(200);
    expect(await resFlexible.json()).toEqual({ message: 'Flexible Success' });

    // 2. But if the rule value is invalid (e.g. 999 instead of 150), it fails (404)
    const invalidFlexiblePayload = {
      '1_level': {
        jumlah_karyawan: 999,
      },
    };

    const reqInvalid = new NextRequest('http://localhost/api/flexible/job', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidFlexiblePayload),
    });

    const resInvalid = await handleInternalApiRequest(reqInvalid);
    expect(resInvalid.status).toBe(404);
  });

  it('handleInternalApiRequest should match incoming request using bodyRules (e.g. debitur.0.id_number)', async () => {
    clearInternalProxyCache();
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'api-debitur', projectId: 'p1', path: '/api/credit/approval', methodRequest: 'POST', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r-debitur',
          apiId: 'api-debitur',
          name: 'Debitur Specific Rule',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {},
          bodyRules: [
            { path: 'debitur.0.id_number', operator: 'equal', value: '3603110302740006', enabled: true },
            { path: 'transaction_id', operator: 'regex', value: '^KPM-TST-\\d+$', enabled: true },
          ],
          bodyType: 'JSON',
          matchType: 'PARTIAL',
          matchStrategy: 'ALL',
          priority: 1,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res-debitur',
          requestScenarioId: 'r-debitur',
          name: 'Approved',
          statusCode: 200,
          headers: {},
          body: { status: 'APPROVED', message: 'Debitur verified' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 1,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    const validPayload = {
      debitur: [
        {
          birth_date: '2003-10-21',
          id_number: '3603110302740006',
          legal_name: 'HARWADLI MANDEA',
          surgate_mother_name: 'YASLA SARATU',
          type: 'KTP',
        },
      ],
      lob: 1,
      transaction_id: 'KPM-TST-66772340038',
    };

    // Valid payload matching bodyRules
    const validReq = new NextRequest('http://localhost/api/credit/approval', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const validRes = await handleInternalApiRequest(validReq);
    expect(validRes.status).toBe(200);
    expect(await validRes.json()).toEqual({ status: 'APPROVED', message: 'Debitur verified' });

    // Invalid payload where debitur id_number does not match
    const invalidPayload = {
      ...validPayload,
      debitur: [
        {
          ...validPayload.debitur[0],
          id_number: '1234567890123456',
        },
      ],
    };

    const invalidReq = new NextRequest('http://localhost/api/credit/approval', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const invalidRes = await handleInternalApiRequest(invalidReq);
    expect(invalidRes.status).toBe(404);
  });

  it('handleInternalApiRequest should return 404 when request has unexpected Authorization header and scenario has empty headers', async () => {
    const mockDb = {
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/api/user', methodRequest: 'GET', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        {
          id: 'r1',
          apiId: 'a1',
          name: 'ok gas',
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {},
          bodyType: 'NONE',
          matchType: 'EXACT',
          priority: 1,
          status: true,
        },
      ],
      responseScenarios: [
        {
          id: 'res1',
          requestScenarioId: 'r1',
          name: 'HTTP 200',
          statusCode: 200,
          headers: {},
          body: {
            code: 200,
            data: { user: { id: 1024, name: 'Alex Morgan' } },
            status: 'success',
          },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 1,
          status: true,
        },
      ],
    };

    (readDatabase as any).mockResolvedValue(mockDb);

    // 1. Without unexpected Authorization header -> should match and return 200
    const reqWithoutAuth = new NextRequest('http://localhost/api/user', {
      headers: {
        'user-agent': 'PostmanRuntime/7.43.0',
        accept: '*/*',
      },
    });
    const resWithoutAuth = await handleInternalApiRequest(reqWithoutAuth);
    expect(resWithoutAuth.status).toBe(200);
    expect((await resWithoutAuth.json()).code).toBe(200);

    // 2. With unexpected Authorization header -> should NOT match and return 404
    const reqWithAuth = new NextRequest('http://localhost/api/user', {
      headers: {
        'user-agent': 'PostmanRuntime/7.43.0',
        accept: '*/*',
        authorization: 'xx2',
      },
    });
    const resWithAuth = await handleInternalApiRequest(reqWithAuth);
    expect(resWithAuth.status).toBe(404);
  });

  it('handleInternalApiRequest should return open CORS headers for mock APIs regardless of APP_URL', async () => {
    process.env.APP_URL = 'http://localhost:3000';

    (readDatabase as any).mockResolvedValue({
      projects: [{ id: 'p1', status: true }],
      environments: [{ id: 'env1', projectId: 'p1', status: true }],
      apiCollections: [
        { id: 'a1', projectId: 'p1', path: '/cors-test', methodRequest: 'GET', status: true },
      ],
      apiEnvironments: [],
      requestScenarios: [
        { id: 'r1', apiId: 'a1', name: 'Req 1', headers: {}, queryParams: {}, pathParams: {}, body: {}, bodyType: 'NONE', matchType: 'EXACT', priority: 10, status: true },
      ],
      responseScenarios: [
        { id: 'res1', requestScenarioId: 'r1', name: '200 OK', statusCode: 200, headers: {}, body: { ok: true }, responseType: 'JSON', delayMs: 0, weight: 100, priority: 10, status: true },
      ],
    });

    // 1. Regular GET request with any external Origin header
    const reqGet = new NextRequest('http://localhost/cors-test', {
      headers: { origin: 'http://external-app.com:5173' },
    });
    const resGet = await handleInternalApiRequest(reqGet);
    expect(resGet.status).toBe(200);
    expect(resGet.headers.get('access-control-allow-origin')).toBe('http://external-app.com:5173');
    expect(resGet.headers.get('access-control-allow-credentials')).toBe('true');
    expect(resGet.headers.get('access-control-allow-methods')).toContain('GET');

    // 2. OPTIONS preflight request from any origin
    const reqPreflight = new NextRequest('http://localhost/cors-test', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://external-app.com:5173',
        'access-control-request-method': 'POST',
      },
    });
    const resPreflight = await handleInternalApiRequest(reqPreflight);
    expect(resPreflight.status).toBe(204);
    expect(resPreflight.headers.get('access-control-allow-origin')).toBe('http://external-app.com:5173');
    expect(resPreflight.headers.get('access-control-allow-methods')).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');

    // 3. 404 response should still attach open CORS headers
    const reqNotFound = new NextRequest('http://localhost/non-existent', {
      headers: { origin: 'http://external-app.com:5173' },
    });
    const resNotFound = await handleInternalApiRequest(reqNotFound);
    expect(resNotFound.status).toBe(404);
    expect(resNotFound.headers.get('access-control-allow-origin')).toBe('http://external-app.com:5173');
  });
});



