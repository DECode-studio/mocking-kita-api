import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as signInHandler } from '@/src/app/api/v1/external/auth/signin/route';
import { PUT as upsertApiHandler } from '@/src/app/api/v1/external/apis/upsert/route';
import { GET as listApisHandler } from '@/src/app/api/v1/external/apis/route';
import { PUT as upsertRequestScenarioHandler } from '@/src/app/api/v1/external/request-scenarios/upsert/route';
import { GET as listRequestScenariosHandler } from '@/src/app/api/v1/external/request-scenarios/route';
import { PUT as upsertResponseScenarioHandler } from '@/src/app/api/v1/external/response-scenarios/upsert/route';
import { GET as listResponseScenariosHandler } from '@/src/app/api/v1/external/response-scenarios/route';
import { POST as upsertOpenApiHandler } from '@/src/app/api/v1/external/openapi/upsert/route';
import { NextRequest } from 'next/server';

vi.mock('@/src/core/db/prisma-client', () => {
  return {
    default: {
      account: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'acc-123',
          username: 'admin',
          password: 'pbkdf2:sha512:210000:dummy:hash',
          role: 'ADMIN',
          name: 'Admin',
        }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({ id: 'proj-123', name: 'Test Project' }),
      },
      api: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.projectId === 'proj-123') {
            return Promise.resolve({
              id: 'api-123',
              projectId: 'proj-123',
              collectionId: null,
              name: 'Test API',
              path: '/v1/test',
              methodRequest: 'GET',
              status: true,
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
            });
          }
          return Promise.resolve(null);
        }),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'api-123') {
            return Promise.resolve({
              id: 'api-123',
              projectId: 'proj-123',
              name: 'Test API',
              path: '/v1/test',
              methodRequest: 'GET',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'api-123',
            projectId: 'proj-123',
            collectionId: null,
            name: 'Test API',
            description: 'Test API description',
            path: '/v1/test',
            methodRequest: 'GET',
            status: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'api-123',
            ...data,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'api-123',
            projectId: 'proj-123',
            name: data.name || 'Test API',
            path: '/v1/test',
            methodRequest: 'GET',
            status: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
      },
      requestScenario: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'req-123') {
            return Promise.resolve({
              id: 'req-123',
              apiId: 'api-123',
              name: 'Existing Request Scenario',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'req-123',
            apiId: 'api-123',
            name: 'Scenario 1',
            headers: {},
            queryParams: {},
            pathParams: {},
            body: null,
            bodyType: 'JSON',
            matchType: 'EXACT',
            matchStrategy: 'ALL',
            strictBodyStructure: true,
            priority: 0,
            status: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          },
        ]),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: data.id || 'req-123',
            ...data,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'req-123',
            apiId: 'api-123',
            ...data,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
      },
      responseScenario: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'resp-123') {
            return Promise.resolve({
              id: 'resp-123',
              requestScenarioId: 'req-123',
              name: 'Existing Response Scenario',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'resp-123',
            requestScenarioId: 'req-123',
            name: '200 OK',
            statusCode: 200,
            headers: {},
            body: { success: true },
            responseType: 'JSON',
            delayMs: 0,
            weight: 100,
            priority: 0,
            status: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          },
        ]),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: data.id || 'resp-123',
            ...data,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'resp-123',
            requestScenarioId: 'req-123',
            ...data,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          })
        ),
      },
    },
  };
});

vi.mock('@/src/core/utils/password-hash', () => {
  return {
    verifyPassword: vi.fn().mockReturnValue(true),
    hashPassword: vi.fn().mockReturnValue('hashed'),
  };
});

vi.mock('@/src/core/db/openapi_storage_helper', () => {
  return {
    importProjectOpenApi: vi.fn().mockResolvedValue({
      importedApiCount: 2,
      importedCollectionCount: 1,
      updatedApiCount: 0,
    }),
  };
});

describe('External Integration APIs', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should authenticate external user via Sign-In and return JWT token', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'password123',
      }),
    });

    const res = await signInHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.tokenType).toBe('Bearer');
    expect(json.data.accessToken).toBeDefined();
  });

  it('should reject unauthorized requests missing token or x-api-key', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/apis?projectId=proj-123');
    const res = await listApisHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should allow requests authenticated with x-api-key header', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/apis?projectId=proj-123', {
      headers: {
        'x-api-key': 'mock-studio-api-key',
      },
    });
    const res = await listApisHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
  });

  it('should upsert API using Bearer token authentication', async () => {
    const signInReq = new NextRequest('http://localhost:3000/api/v1/external/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'password123',
      }),
    });
    const signInRes = await signInHandler(signInReq);
    const signInJson = await signInRes.json();
    const token = signInJson.data.accessToken;

    const req = new NextRequest('http://localhost:3000/api/v1/external/apis/upsert', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId: 'proj-123',
        name: 'New Test API',
        path: '/v1/users',
        methodRequest: 'POST',
      }),
    });

    const res = await upsertApiHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.path).toBe('/v1/test');
  });

  it('should upsert Request Scenario', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/request-scenarios/upsert', {
      method: 'PUT',
      headers: {
        'x-api-key': 'mock-studio-api-key',
      },
      body: JSON.stringify({
        apiId: 'api-123',
        name: 'Valid Scenario',
      }),
    });

    const res = await upsertRequestScenarioHandler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Valid Scenario');
  });

  it('should list Request Scenarios by endpoint', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/v1/external/request-scenarios?projectId=proj-123&path=/v1/test&methodRequest=GET',
      {
        headers: {
          'x-api-key': 'mock-studio-api-key',
        },
      }
    );

    const res = await listRequestScenariosHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('should upsert Response Scenario', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/response-scenarios/upsert', {
      method: 'PUT',
      headers: {
        'x-api-key': 'mock-studio-api-key',
      },
      body: JSON.stringify({
        requestScenarioId: 'req-123',
        name: '200 OK Response',
        statusCode: 200,
      }),
    });

    const res = await upsertResponseScenarioHandler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('200 OK Response');
  });

  it('should list Response Scenarios by requestScenarioId', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/response-scenarios?requestScenarioId=req-123', {
      headers: {
        'x-api-key': 'mock-studio-api-key',
      },
    });

    const res = await listResponseScenariosHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('should bulk upsert OpenAPI specification', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/openapi/upsert', {
      method: 'POST',
      headers: {
        'x-api-key': 'mock-studio-api-key',
      },
      body: JSON.stringify({
        projectId: 'proj-123',
        mode: 'upsert',
        openApiJson: {
          openapi: '3.0.0',
          info: { title: 'Test Spec', version: '1.0' },
          paths: {},
        },
      }),
    });

    const res = await upsertOpenApiHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.importedApis).toBe(2);
  });
});
