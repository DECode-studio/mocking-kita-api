export interface ExternalEndpointSpec {
  id: string;
  category: 'Authentication' | 'APIs' | 'Request Scenarios' | 'Response Scenarios' | 'OpenAPI Import';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  requiresAuth: boolean;
  queryParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
    example?: string;
  }>;
  requestBodyExample?: Record<string, any>;
  responseExamples: Array<{
    status: number;
    title: string;
    body: Record<string, any>;
  }>;
}

export const EXTERNAL_ENDPOINTS: ExternalEndpointSpec[] = [
  {
    id: 'auth-signin',
    category: 'Authentication',
    method: 'POST',
    path: '/api/v1/external/auth/signin',
    summary: 'Sign-In External Platform',
    description: 'Melakukan autentikasi email/username dan password untuk mendapatkan JWT Bearer Token.',
    requiresAuth: false,
    requestBodyExample: {
      username: 'admin',
      password: 'mockapi2026admin',
    },
    responseExamples: [
      {
        status: 200,
        title: '200 OK - Sign-in Successful',
        body: {
          success: true,
          message: 'Authentication successful',
          data: {
            tokenType: 'Bearer',
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: 86400,
            user: {
              sub: 'usr-123',
              username: 'admin',
              role: 'ADMIN',
              name: 'Administrator',
            },
          },
        },
      },
      {
        status: 401,
        title: '401 Unauthorized - Invalid Credentials',
        body: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/username or password',
          },
        },
      },
    ],
  },
  {
    id: 'apis-upsert',
    category: 'APIs',
    method: 'PUT',
    path: '/api/v1/external/apis/upsert',
    summary: 'Upsert API by Endpoint',
    description: 'Menambah API baru atau memperbarui API yang sudah ada berdasarkan kombinasi (projectId, path, methodRequest).',
    requiresAuth: true,
    requestBodyExample: {
      projectId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
      collectionId: null,
      name: 'Get User Profile',
      description: 'API untuk mengambil profil user',
      path: '/v1/users/{id}',
      methodRequest: 'GET',
      status: true,
    },
    responseExamples: [
      {
        status: 201,
        title: '201 Created / 200 OK - API Upserted',
        body: {
          success: true,
          message: 'API created successfully',
          action: 'CREATED',
          data: {
            id: 'c3d4e5f6-a7b8-9012-3456-789abcdef012',
            projectId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
            collectionId: null,
            name: 'Get User Profile',
            description: 'API untuk mengambil profil user',
            path: '/v1/users/{id}',
            methodRequest: 'GET',
            status: true,
            createdAt: '2026-09-16T10:00:00.000Z',
            updatedAt: '2026-09-16T10:00:00.000Z',
          },
        },
      },
      {
        status: 400,
        title: '400 Bad Request - Missing Required Fields',
        body: {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: "Fields 'projectId', 'path', 'methodRequest', and 'name' are required",
          },
        },
      },
    ],
  },
  {
    id: 'apis-list',
    category: 'APIs',
    method: 'GET',
    path: '/api/v1/external/apis',
    summary: 'Get List of APIs',
    description: 'Mengambil daftar API terdaftar dalam suatu project dengan filter search & pagination.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'projectId',
        type: 'string (UUID)',
        required: true,
        description: 'ID Project target',
        example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
      },
      {
        name: 'collectionId',
        type: 'string (UUID)',
        required: false,
        description: 'Filter berdasarkan Collection ID',
      },
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Filter pencarian nama atau path API',
        example: 'users',
      },
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: 'Halaman pagination',
        defaultValue: '1',
      },
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Jumlah item per halaman',
        defaultValue: '20',
      },
    ],
    responseExamples: [
      {
        status: 200,
        title: '200 OK - List of APIs',
        body: {
          success: true,
          data: [
            {
              id: 'c3d4e5f6-a7b8-9012-3456-789abcdef012',
              projectId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
              name: 'Get User Profile',
              path: '/v1/users/{id}',
              methodRequest: 'GET',
              status: true,
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      },
    ],
  },
  {
    id: 'request-scenarios-upsert',
    category: 'Request Scenarios',
    method: 'PUT',
    path: '/api/v1/external/request-scenarios/upsert',
    summary: 'Upsert Request Scenario by ID',
    description: 'Menambah atau memperbarui Request Scenario berdasarkan ID skenario.',
    requiresAuth: true,
    requestBodyExample: {
      id: 'req-scenario-uuid-001',
      apiId: 'c3d4e5f6-a7b8-9012-3456-789abcdef012',
      name: 'Scenario - User Gold Tier',
      description: 'Request scenario untuk user gold tier',
      headers: {
        'X-Tier': 'GOLD',
      },
      queryParams: {
        include: 'loyalty',
      },
      pathParams: {
        id: '1001',
      },
      body: {
        action: 'check_status',
      },
      bodyType: 'JSON',
      matchType: 'EXACT',
      matchStrategy: 'ALL',
      strictBodyStructure: true,
      priority: 10,
      status: true,
    },
    responseExamples: [
      {
        status: 200,
        title: '200 OK / 201 Created - Scenario Upserted',
        body: {
          success: true,
          message: 'Request scenario updated successfully',
          action: 'UPDATED',
          data: {
            id: 'req-scenario-uuid-001',
            apiId: 'c3d4e5f6-a7b8-9012-3456-789abcdef012',
            name: 'Scenario - User Gold Tier',
            headers: { 'X-Tier': 'GOLD' },
            priority: 10,
            status: true,
          },
        },
      },
    ],
  },
  {
    id: 'request-scenarios-list',
    category: 'Request Scenarios',
    method: 'GET',
    path: '/api/v1/external/request-scenarios',
    summary: 'Get List Request Scenario by Endpoint',
    description: 'Mengambil daftar Request Scenario berdasarkan endpoint (projectId, path, methodRequest) atau apiId.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'projectId',
        type: 'string (UUID)',
        required: false,
        description: 'ID Project',
        example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
      },
      {
        name: 'path',
        type: 'string',
        required: false,
        description: 'Endpoint path URI',
        example: '/v1/users/{id}',
      },
      {
        name: 'methodRequest',
        type: 'string',
        required: false,
        description: 'HTTP Method (GET, POST, dst)',
        example: 'GET',
      },
      {
        name: 'apiId',
        type: 'string (UUID)',
        required: false,
        description: 'ID API langsung',
      },
    ],
    responseExamples: [
      {
        status: 200,
        title: '200 OK - List of Request Scenarios',
        body: {
          success: true,
          data: [
            {
              id: 'req-scenario-uuid-001',
              apiId: 'c3d4e5f6-a7b8-9012-3456-789abcdef012',
              name: 'Scenario - User Gold Tier',
              headers: { 'X-Tier': 'GOLD' },
              priority: 10,
              status: true,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'response-scenarios-upsert',
    category: 'Response Scenarios',
    method: 'PUT',
    path: '/api/v1/external/response-scenarios/upsert',
    summary: 'Upsert Response Scenario by ID',
    description: 'Menambah atau memperbarui Response Scenario berdasarkan ID skenario respon.',
    requiresAuth: true,
    requestBodyExample: {
      id: 'resp-scenario-uuid-001',
      requestScenarioId: 'req-scenario-uuid-001',
      name: 'Response 200 OK - User Gold Data',
      description: 'Pengembalian data lengkap user gold tier',
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        code: 'SUCCESS',
        data: {
          id: '1001',
          tier: 'GOLD',
          balance: 500000,
        },
      },
      responseType: 'JSON',
      delayMs: 50,
      weight: 100,
      priority: 1,
      status: true,
    },
    responseExamples: [
      {
        status: 200,
        title: '200 OK / 201 Created - Response Scenario Upserted',
        body: {
          success: true,
          message: 'Response scenario updated successfully',
          action: 'UPDATED',
          data: {
            id: 'resp-scenario-uuid-001',
            requestScenarioId: 'req-scenario-uuid-001',
            name: 'Response 200 OK - User Gold Data',
            statusCode: 200,
            body: { code: 'SUCCESS', data: { tier: 'GOLD' } },
          },
        },
      },
    ],
  },
  {
    id: 'response-scenarios-list',
    category: 'Response Scenarios',
    method: 'GET',
    path: '/api/v1/external/response-scenarios',
    summary: 'Get List Response Scenario by Endpoint',
    description: 'Mengambil daftar Response Scenario berdasarkan endpoint atau requestScenarioId.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'projectId',
        type: 'string (UUID)',
        required: false,
        description: 'ID Project',
        example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
      },
      {
        name: 'path',
        type: 'string',
        required: false,
        description: 'Endpoint path URI',
        example: '/v1/users/{id}',
      },
      {
        name: 'methodRequest',
        type: 'string',
        required: false,
        description: 'HTTP Method (GET, POST, dst)',
        example: 'GET',
      },
      {
        name: 'requestScenarioId',
        type: 'string (UUID)',
        required: false,
        description: 'ID Request Scenario langsung',
      },
    ],
    responseExamples: [
      {
        status: 200,
        title: '200 OK - List of Response Scenarios',
        body: {
          success: true,
          data: [
            {
              id: 'resp-scenario-uuid-001',
              requestScenarioId: 'req-scenario-uuid-001',
              name: 'Response 200 OK - User Gold Data',
              statusCode: 200,
              body: { code: 'SUCCESS' },
            },
          ],
        },
      },
    ],
  },
  {
    id: 'openapi-upsert',
    category: 'OpenAPI Import',
    method: 'POST',
    path: '/api/v1/external/openapi/upsert',
    summary: 'Upsert Swagger / OpenAPI JSON Specification',
    description: 'Meng-import / upsert massal spesifikasi OpenAPI JSON/YAML ke dalam Project.',
    requiresAuth: true,
    requestBodyExample: {
      projectId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
      mode: 'upsert',
      openApiJson: {
        openapi: '3.0.0',
        info: {
          title: 'Payment Service API',
          version: '1.0.0',
        },
        paths: {
          '/v1/payments/charge': {
            post: {
              summary: 'Process Payment Charge',
              responses: {
                '200': {
                  description: 'Payment Successful',
                },
              },
            },
          },
        },
      },
    },
    responseExamples: [
      {
        status: 200,
        title: '200 OK - OpenAPI Specs Imported',
        body: {
          success: true,
          message: 'OpenAPI specification imported/upserted successfully',
          data: {
            projectId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
            mode: 'upsert',
            importedApis: 1,
            importedCollections: 1,
            updatedApis: 0,
          },
        },
      },
    ],
  },
];
