import { describe, it, expect } from 'vitest';
import {
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
  getEnvironmentValue,
  getEnvironmentVariablesMap,
  Environment,
} from '@/src/client/domain/environment/entity/environment';

describe('Environment Matrix Model Helpers', () => {
  describe('normalizeEnvironmentValues', () => {
    it('should force LOCAL to null when isBaseUrl is true', () => {
      const input = {
        LOCAL: 'http://localhost:3000',
        DEVELOPMENT: 'https://dev.api.com',
        STAGING: 'https://stg.api.com',
      };
      const result = normalizeEnvironmentValues(input, true);
      expect(result.LOCAL).toBeNull();
      expect(result.DEVELOPMENT).toBe('https://dev.api.com');
      expect(result.STAGING).toBe('https://stg.api.com');
      expect(result.TESTING).toBeNull();
      expect(result.PRODUCTION).toBeNull();
    });

    it('should allow LOCAL to be populated when isBaseUrl is false', () => {
      const input = {
        LOCAL: 'mock-key-123',
        DEVELOPMENT: 'dev-key-456',
        PRODUCTION: 'prod-key-789',
      };
      const result = normalizeEnvironmentValues(input, false);
      expect(result.LOCAL).toBe('mock-key-123');
      expect(result.DEVELOPMENT).toBe('dev-key-456');
      expect(result.PRODUCTION).toBe('prod-key-789');
    });

    it('should handle JSON string input cleanly', () => {
      const jsonStr = JSON.stringify({
        DEVELOPMENT: 'https://dev.example.com',
        STAGING: 'https://stg.example.com',
      });
      const result = normalizeEnvironmentValues(jsonStr, true);
      expect(result.DEVELOPMENT).toBe('https://dev.example.com');
      expect(result.STAGING).toBe('https://stg.example.com');
      expect(result.LOCAL).toBeNull();
    });
  });

  describe('getEnvironmentBaseUrl', () => {
    const serviceEnv: Environment = {
      id: 'env-1',
      projectId: 'proj-1',
      name: 'Platform AUTH',
      isBaseUrl: true,
      values: {
        LOCAL: null,
        DEVELOPMENT: 'https://dev-auth.corp.internal',
        TESTING: 'https://test-auth.corp.internal',
        STAGING: 'https://stg-auth.corp.internal',
        PRODUCTION: 'https://auth.company.com',
      },
      status: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should resolve specific stage URL when targetStage is passed', () => {
      expect(getEnvironmentBaseUrl(serviceEnv, 'DEVELOPMENT')).toBe('https://dev-auth.corp.internal');
      expect(getEnvironmentBaseUrl(serviceEnv, 'STAGING')).toBe('https://stg-auth.corp.internal');
      expect(getEnvironmentBaseUrl(serviceEnv, 'PRODUCTION')).toBe('https://auth.company.com');
    });

    it('should return empty string for LOCAL stage on Base URL services', () => {
      expect(getEnvironmentBaseUrl(serviceEnv, 'LOCAL')).toBe('');
    });

    it('should return fallback priority URL when targetStage is not passed', () => {
      expect(getEnvironmentBaseUrl(serviceEnv)).toBe('https://dev-auth.corp.internal');
    });

    it('should return empty string if isBaseUrl is false', () => {
      const varEnv: Environment = {
        ...serviceEnv,
        isBaseUrl: false,
        name: 'API_KEY',
      };
      expect(getEnvironmentBaseUrl(varEnv, 'DEVELOPMENT')).toBe('');
      expect(getEnvironmentBaseUrl(varEnv)).toBe('');
    });
  });

  describe('getEnvironmentValue & getEnvironmentVariablesMap', () => {
    it('should extract correct variable value for stage', () => {
      const varEnv: Environment = {
        id: 'env-var-1',
        projectId: 'proj-1',
        name: 'STRIPE_KEY',
        isBaseUrl: false,
        values: {
          LOCAL: 'sk_test_mock',
          DEVELOPMENT: 'sk_test_dev',
          STAGING: 'sk_test_stg',
          PRODUCTION: 'sk_live_real',
        },
        status: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(getEnvironmentValue(varEnv, 'DEVELOPMENT')).toBe('sk_test_dev');
      expect(getEnvironmentValue(varEnv, 'PRODUCTION')).toBe('sk_live_real');

      const devMap = getEnvironmentVariablesMap(varEnv, 'DEVELOPMENT');
      expect(devMap['STRIPE_KEY']).toBe('sk_test_dev');

      const prodMap = getEnvironmentVariablesMap(varEnv, 'PRODUCTION');
      expect(prodMap['STRIPE_KEY']).toBe('sk_live_real');
    });
  });
});
