import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  interpolateVariables,
  evaluateAssertion,
  extractVariables,
  resolveStepBaseUrl,
  buildNormalizedHeaders,
} from '@/src/server/scenario-flow/scenario-flow.runner';

describe('Scenario Flow Runner Unit Tests', () => {
  describe('getNestedValue', () => {
    it('should extract values using dot notation', () => {
      const obj = { data: { token: 'xyz-123', user: { id: 42 } } };
      expect(getNestedValue(obj, 'data.token')).toBe('xyz-123');
      expect(getNestedValue(obj, 'data.user.id')).toBe(42);
      expect(getNestedValue(obj, 'data.nonexistent')).toBeUndefined();
    });

    it('should extract values using array index bracket notation', () => {
      const obj = {
        data: {
          items: [
            { id: 'item-0', name: 'First' },
            { id: 'item-1', name: 'Second' },
          ],
        },
      };
      expect(getNestedValue(obj, 'data.items[0].id')).toBe('item-0');
      expect(getNestedValue(obj, 'data.items[1].name')).toBe('Second');
      expect(getNestedValue(obj, 'data.items[99]')).toBeUndefined();
    });
  });

  describe('interpolateVariables', () => {
    it('should replace {{varName}} in strings', () => {
      const vars = { host: 'api.example.com', userId: 105 };
      const template = 'https://{{host}}/v1/users/{{userId}}';
      expect(interpolateVariables(template, vars)).toBe('https://api.example.com/v1/users/105');
    });

    it('should preserve type when entire string is a single variable', () => {
      const vars = { count: 42, active: true, payload: { a: 1 } };
      expect(interpolateVariables('{{count}}', vars)).toBe(42);
      expect(interpolateVariables('{{active}}', vars)).toBe(true);
      expect(interpolateVariables('{{payload}}', vars)).toEqual({ a: 1 });
    });

    it('should resolve dynamic generators like {{$uuid}}, {{$timestamp}}, {{$randomEmail}}', () => {
      const interpolated = interpolateVariables('User-{{$uuid}}', {});
      expect(interpolated).toMatch(/^User-[0-9a-fA-F-]+$/);

      const email = interpolateVariables('{{$randomEmail}}', {});
      expect(email).toMatch(/@example\.com$/);
    });

    it('should recursively interpolate deep objects and arrays', () => {
      const vars = { name: 'Alice', role: 'admin', teamId: 9 };
      const body = {
        user: {
          name: '{{name}}',
          roles: ['member', '{{role}}'],
          team: '{{teamId}}',
        },
      };

      const result = interpolateVariables(body, vars);
      expect(result).toEqual({
        user: {
          name: 'Alice',
          roles: ['member', 'admin'],
          team: 9,
        },
      });
    });
  });

  describe('evaluateAssertion', () => {
    const mockResponse = {
      status: 201,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-999' },
      body: { success: true, count: 15, item: { name: 'Widget' } },
      responseTimeMs: 120,
    };

    it('should evaluate statusCode assertion', () => {
      const pass = evaluateAssertion({ type: 'statusCode', operator: 'equals', expected: 201 }, mockResponse);
      expect(pass.passed).toBe(true);

      const fail = evaluateAssertion({ type: 'statusCode', operator: 'equals', expected: 200 }, mockResponse);
      expect(fail.passed).toBe(false);
    });

    it('should evaluate bodyPath equals & contains assertions', () => {
      const passEquals = evaluateAssertion(
        { type: 'bodyPath', path: 'item.name', operator: 'equals', expected: 'Widget' },
        mockResponse
      );
      expect(passEquals.passed).toBe(true);

      const passContains = evaluateAssertion(
        { type: 'bodyPath', path: 'item.name', operator: 'contains', expected: 'Wid' },
        mockResponse
      );
      expect(passContains.passed).toBe(true);

      const passGreater = evaluateAssertion(
        { type: 'bodyPath', path: 'count', operator: 'greaterThan', expected: 10 },
        mockResponse
      );
      expect(passGreater.passed).toBe(true);
    });

    it('should evaluate exists & notExists', () => {
      const passExists = evaluateAssertion(
        { type: 'bodyPath', path: 'success', operator: 'exists' },
        mockResponse
      );
      expect(passExists.passed).toBe(true);

      const passNotExists = evaluateAssertion(
        { type: 'bodyPath', path: 'missingField', operator: 'notExists' },
        mockResponse
      );
      expect(passNotExists.passed).toBe(true);
    });

    it('should evaluate header assertion', () => {
      const passHeader = evaluateAssertion(
        { type: 'header', path: 'x-request-id', operator: 'equals', expected: 'req-999' },
        mockResponse
      );
      expect(passHeader.passed).toBe(true);
    });

    it('should evaluate responseTime assertion', () => {
      const passTime = evaluateAssertion(
        { type: 'responseTime', operator: 'lessThan', expected: 500 },
        mockResponse
      );
      expect(passTime.passed).toBe(true);
    });
  });

  describe('extractVariables', () => {
    const mockResponse = {
      status: 200,
      headers: { authorization: 'Bearer token-abc-123' },
      body: {
        data: {
          token: 'jwt-token-xyz',
          user: { id: 'usr-888', email: 'test@example.com' },
        },
      },
    };

    it('should extract variables from body, headers, and status', () => {
      const extractors = [
        { variable: 'authToken', from: 'body' as const, path: 'data.token' },
        { variable: 'userId', from: 'body' as const, path: 'data.user.id' },
        { variable: 'authHeader', from: 'headers' as const, path: 'authorization' },
        { variable: 'httpStatus', from: 'status' as const, path: '' },
      ];

      const result = extractVariables(extractors, mockResponse);
      expect(result).toEqual({
        authToken: 'jwt-token-xyz',
        userId: 'usr-888',
        authHeader: 'Bearer token-abc-123',
        httpStatus: 200,
      });
    });
  });

  describe('resolveStepBaseUrl', () => {
    const projectEnvs = [
      { environmentType: 'DEVELOPMENT', status: true, baseUrl: 'https://dev-proj.example.com' },
      { environmentType: 'STAGING', status: true, baseUrl: 'https://stg-proj.example.com' },
    ];

    const apiWithEnvs = {
      apiEnvironments: [
        {
          enabled: true,
          environment: {
            environmentType: 'STAGING',
            status: true,
            baseUrl: 'https://stg-api.example.com',
          },
        },
      ],
    };

    it('should force LOCAL APP_URL when step targetEnvironmentType is LOCAL regardless of header targetEnvType', () => {
      const step = {
        targetEnvironmentType: 'LOCAL',
        api: apiWithEnvs,
      };

      const originalAppUrl = process.env.APP_URL;
      process.env.APP_URL = 'http://127.0.0.1:3000';
      try {
        const result = resolveStepBaseUrl(step, 'STAGING', projectEnvs);
        expect(result).toBe('http://127.0.0.1:3000');
      } finally {
        process.env.APP_URL = originalAppUrl;
      }
    });

    it('should resolve from apiEnvironments when step targetEnvironmentType is DEFAULT (inherit header)', () => {
      const step = {
        targetEnvironmentType: 'DEFAULT',
        api: apiWithEnvs,
      };

      const result = resolveStepBaseUrl(step, 'STAGING', projectEnvs);
      expect(result).toBe('https://stg-api.example.com');
    });

    it('should fall back to projectEnvironments if apiEnvironments does not match', () => {
      const step = {
        targetEnvironmentType: 'DEFAULT',
        api: apiWithEnvs,
      };

      const result = resolveStepBaseUrl(step, 'DEVELOPMENT', projectEnvs);
      expect(result).toBe('https://dev-proj.example.com');
    });

    it('should resolve base URL matching explicit targetEnvironment like "otp" or "auth"', () => {
      const multiProjectEnvs = [
        { name: 'Platform AUTH DEV', environmentType: 'DEVELOPMENT', status: true, baseUrl: 'https://dev-plat-auth.kbfinansia.com' },
        { name: 'Platform AUTH STG', environmentType: 'STAGING', status: true, baseUrl: 'https://stg-plat-auth.kbfinansia.com' },
        { name: 'Platform OTP DEV', environmentType: 'DEVELOPMENT', status: true, baseUrl: 'https://dev-plat-otp.kbfinansia.com' },
        { name: 'Platform OTP STG', environmentType: 'STAGING', status: true, baseUrl: 'https://stg-plat-otp.kbfinansia.com' },
      ];

      const authStep = {
        targetEnvironmentType: 'DEFAULT',
        targetEnvironment: 'auth',
      };

      const otpStep = {
        targetEnvironmentType: 'DEFAULT',
        targetEnvironment: 'otp',
      };

      expect(resolveStepBaseUrl(authStep, 'DEVELOPMENT', multiProjectEnvs)).toBe('https://dev-plat-auth.kbfinansia.com');
      expect(resolveStepBaseUrl(authStep, 'STAGING', multiProjectEnvs)).toBe('https://stg-plat-auth.kbfinansia.com');
      expect(resolveStepBaseUrl(otpStep, 'DEVELOPMENT', multiProjectEnvs)).toBe('https://dev-plat-otp.kbfinansia.com');
      expect(resolveStepBaseUrl(otpStep, 'STAGING', multiProjectEnvs)).toBe('https://stg-plat-otp.kbfinansia.com');
    });

    it('should resolve base URL from consolidated Matrix Environment model per stage', () => {
      const matrixProjectEnvs = [
        {
          id: 'env-matrix-auth',
          name: 'Platform AUTH',
          isBaseUrl: true,
          values: {
            LOCAL: null,
            DEVELOPMENT: 'https://dev-plat-auth.kbfinansia.com',
            STAGING: 'https://stg-plat-auth.kbfinansia.com',
            PRODUCTION: 'https://auth.kbfinansia.com',
          },
          status: true,
        },
        {
          id: 'env-matrix-otp',
          name: 'Platform OTP',
          isBaseUrl: true,
          values: {
            LOCAL: null,
            DEVELOPMENT: 'https://dev-plat-otp.kbfinansia.com',
            STAGING: 'https://stg-plat-otp.kbfinansia.com',
          },
          status: true,
        },
      ];

      const authStepById = {
        targetEnvironmentType: 'DEFAULT',
        targetEnvironment: 'env-matrix-auth',
      };

      const authStepByName = {
        targetEnvironmentType: 'DEFAULT',
        targetEnvironment: 'Platform AUTH',
      };

      const authStepLocal = {
        targetEnvironmentType: 'LOCAL',
        targetEnvironment: 'env-matrix-auth',
      };

      // When target is DEVELOPMENT
      expect(resolveStepBaseUrl(authStepById, 'DEVELOPMENT', matrixProjectEnvs)).toBe(
        'https://dev-plat-auth.kbfinansia.com'
      );
      expect(resolveStepBaseUrl(authStepByName, 'DEVELOPMENT', matrixProjectEnvs)).toBe(
        'https://dev-plat-auth.kbfinansia.com'
      );

      // When target is STAGING
      expect(resolveStepBaseUrl(authStepById, 'STAGING', matrixProjectEnvs)).toBe(
        'https://stg-plat-auth.kbfinansia.com'
      );

      // When target is PRODUCTION
      expect(resolveStepBaseUrl(authStepById, 'PRODUCTION', matrixProjectEnvs)).toBe(
        'https://auth.kbfinansia.com'
      );

      // When step specifies LOCAL, always returns internal mock URL regardless of matrix target
      expect(resolveStepBaseUrl(authStepLocal, 'DEVELOPMENT', matrixProjectEnvs)).toMatch(
        /^http:\/\//
      );
    });
  });

  describe('buildNormalizedHeaders', () => {
    it('should default Content-Type to application/json when bodyType is JSON or undefined', () => {
      const headers = buildNormalizedHeaders(null, null, {}, {}, 'JSON');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });

    it('should omit Content-Type header when bodyType is FORM_DATA', () => {
      const headers = buildNormalizedHeaders(null, { 'Content-Type': 'multipart/form-data' }, {}, {}, 'FORM_DATA');
      expect(headers['Content-Type']).toBeUndefined();
      expect(headers['Accept']).toBe('application/json');
    });

    it('should set Content-Type to application/x-www-form-urlencoded when bodyType is URL_ENCODED', () => {
      const headers = buildNormalizedHeaders(null, null, {}, {}, 'URL_ENCODED');
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(headers['Accept']).toBe('application/json');
    });

    it('should omit Content-Type when bodyType is NONE', () => {
      const headers = buildNormalizedHeaders(null, null, {}, {}, 'NONE');
      expect(headers['Content-Type']).toBeUndefined();
      expect(headers['Accept']).toBe('application/json');
    });
  });
});

