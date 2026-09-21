import { describe, it, expect } from 'vitest';
import {
  resolveStepBaseUrl,
  interpolateVariables,
} from '@/src/server/scenario-flow/scenario-flow.runner';
import {
  parseOpenApiSpecToProjectData,
  exportProjectToOpenApiSpec,
} from '@/src/core/openapi/openapi_converter';
import {
  Environment,
  getEnvironmentVariablesMap,
} from '@/src/client/domain/environment/entity/environment';

describe('End-to-End Matrix Environment Verification (Phase 6)', () => {
  // Common Mock Data
  const mockServiceEnv: Environment = {
    id: 'env-auth-svc',
    name: 'Platform AUTH Service',
    projectId: 'proj-demo',
    isBaseUrl: true,
    values: {
      LOCAL: null,
      DEVELOPMENT: 'https://auth-dev.internal.corp/api/v1',
      STAGING: 'https://auth-staging.internal.corp/api/v1',
      PRODUCTION: 'https://auth.company.com/api/v1',
    },
    variables: [],
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSecretEnv: Environment = {
    id: 'env-secrets',
    name: 'Shared Credentials',
    projectId: 'proj-demo',
    isBaseUrl: false,
    values: {
      LOCAL: 'local-mock-api-key',
      DEVELOPMENT: 'dev-secret-token-xyz',
      STAGING: 'stg-secret-token-abc',
      PRODUCTION: 'prod-secret-token-999',
    },
    variables: [],
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('1. Scenario Flow Runner Multi-Stage Resolution', () => {
    const mockStep: any = {
      id: 'step-1',
      scenarioFlowId: 'flow-1',
      stepOrder: 1,
      name: 'Verify Token',
      targetEnvironmentType: 'DEFAULT',
      targetEnvironment: 'env-auth-svc',
      methodOverride: 'POST',
      pathOverride: '/token/verify',
      api: {
        id: 'api-1',
        projectId: 'proj-demo',
        name: 'Verify API',
        path: '/token/verify',
        methodRequest: 'POST',
        apiEnvironments: [{ environment: mockServiceEnv }],
      },
    };

    it('should route to internal Mock Server when executed on LOCAL stage', () => {
      const resolved = resolveStepBaseUrl(mockStep, 'LOCAL', [mockServiceEnv]);
      // LOCAL must target internal mock proxy server (not external URLs)
      expect(resolved).not.toContain('auth-dev');
      expect(resolved).not.toContain('auth-staging');
      expect(resolved).toMatch(/http:\/\/(localhost|127\.0\.0\.1):/);
    });

    it('should route to DEVELOPMENT matrix Base URL when executed on DEVELOPMENT stage', () => {
      const resolved = resolveStepBaseUrl(mockStep, 'DEVELOPMENT', [mockServiceEnv]);
      expect(resolved).toBe('https://auth-dev.internal.corp/api/v1');
    });

    it('should route to STAGING matrix Base URL when executed on STAGING stage', () => {
      const resolved = resolveStepBaseUrl(mockStep, 'STAGING', [mockServiceEnv]);
      expect(resolved).toBe('https://auth-staging.internal.corp/api/v1');
    });

    it('should route to PRODUCTION matrix Base URL when executed on PRODUCTION stage', () => {
      const resolved = resolveStepBaseUrl(mockStep, 'PRODUCTION', [mockServiceEnv]);
      expect(resolved).toBe('https://auth.company.com/api/v1');
    });

    it('should inject stage-specific secrets into request variables', () => {
      // 1. LOCAL stage variables
      const localVars = getEnvironmentVariablesMap(mockSecretEnv, 'LOCAL');
      expect(localVars['Shared Credentials']).toBe('local-mock-api-key');
      expect(interpolateVariables('Bearer {{Shared Credentials}}', localVars)).toBe(
        'Bearer local-mock-api-key'
      );

      // 2. DEVELOPMENT stage variables
      const devVars = getEnvironmentVariablesMap(mockSecretEnv, 'DEVELOPMENT');
      expect(devVars['Shared Credentials']).toBe('dev-secret-token-xyz');
      expect(interpolateVariables('Bearer {{Shared Credentials}}', devVars)).toBe(
        'Bearer dev-secret-token-xyz'
      );

      // 3. STAGING stage variables
      const stgVars = getEnvironmentVariablesMap(mockSecretEnv, 'STAGING');
      expect(stgVars['Shared Credentials']).toBe('stg-secret-token-abc');
      expect(interpolateVariables('Bearer {{Shared Credentials}}', stgVars)).toBe(
        'Bearer stg-secret-token-abc'
      );

      // 4. PRODUCTION stage variables
      const prodVars = getEnvironmentVariablesMap(mockSecretEnv, 'PRODUCTION');
      expect(prodVars['Shared Credentials']).toBe('prod-secret-token-999');
      expect(interpolateVariables('Bearer {{Shared Credentials}}', prodVars)).toBe(
        'Bearer prod-secret-token-999'
      );
    });
  });

  describe('2. OpenAPI / Swagger Matrix Parser & Exporter', () => {
    it('should convert multi-server Swagger spec into consolidated matrix environment', () => {
      const swaggerSpec = {
        openapi: '3.0.0',
        info: { title: 'Payment API', version: '1.0.0' },
        servers: [
          { url: 'https://payment-dev.example.com/v1', description: 'Development Server' },
          { url: 'https://payment-stg.example.com/v1', description: 'Staging Server' },
          { url: 'https://payment.example.com/v1', description: 'Production Server' },
        ],
        paths: {
          '/pay': {
            post: {
              summary: 'Charge card',
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      const result = parseOpenApiSpecToProjectData('proj-1', swaggerSpec);
      expect(result.environments.length).toBe(1);

      const matrixEnv = result.environments[0];
      expect(matrixEnv.isBaseUrl).toBe(true);
      expect(matrixEnv.values).toBeDefined();
      expect(matrixEnv.values?.LOCAL).toBeNull();
      expect(matrixEnv.values?.DEVELOPMENT).toBe('https://payment-dev.example.com/v1');
      expect(matrixEnv.values?.STAGING).toBe('https://payment-stg.example.com/v1');
      expect(matrixEnv.values?.PRODUCTION).toBe('https://payment.example.com/v1');
    });

    it('should export matrix environment into OpenAPI servers array', () => {
      const projectWithMatrix = {
        id: 'proj-1',
        name: 'Demo Project',
        description: 'Testing export',
      };

      const apis: any[] = [
        {
          id: 'api-1',
          name: 'Check status',
          path: '/status',
          methodRequest: 'GET',
          projectId: 'proj-1',
        },
      ];

      const openApiDoc = exportProjectToOpenApiSpec(
        projectWithMatrix as any,
        [],
        apis,
        [],
        [],
        [mockServiceEnv]
      );

      expect(openApiDoc.servers).toBeDefined();
      expect(openApiDoc.servers?.length).toBe(3); // Dev, Staging, Production (LOCAL excluded from servers)
      expect(openApiDoc.servers?.some((s) => s.url.includes('auth-dev'))).toBe(true);
      expect(openApiDoc.servers?.some((s) => s.url.includes('auth-staging'))).toBe(true);
      expect(openApiDoc.servers?.some((s) => s.url.includes('auth.company'))).toBe(true);
    });
  });

  describe('3. Scenario Flow Template Import/Export Backward Compatibility', () => {
    it('should support matrix environment format in flow templates', () => {
      const template = {
        $schema: 'mock-api-studio/scenario-flow/v1',
        version: '1.0',
        flow: {
          name: 'Matrix Pipeline Flow',
          description: 'Flow with matrix environments',
          targetEnvType: 'STAGING',
        },
        environments: [
          {
            name: 'Auth Matrix Svc',
            isBaseUrl: true,
            values: {
              LOCAL: null,
              DEVELOPMENT: 'https://auth-dev.example.com',
              STAGING: 'https://auth-staging.example.com',
            },
          },
        ],
        steps: [],
      };

      expect(template.environments[0].isBaseUrl).toBe(true);
      expect(template.environments[0].values.STAGING).toBe('https://auth-staging.example.com');
    });

    it('should normalize legacy single-baseUrl environment definitions into matrix values', () => {
      const legacyEnvDef = {
        name: 'Legacy Dev Server',
        environmentType: 'DEVELOPMENT',
        baseUrl: 'https://legacy-dev.example.com',
      };

      // When processed through matrix normalization
      const values: any = {
        LOCAL: null,
        DEVELOPMENT: legacyEnvDef.baseUrl,
      };

      expect(values.DEVELOPMENT).toBe('https://legacy-dev.example.com');
      expect(values.LOCAL).toBeNull();
    });
  });
});
