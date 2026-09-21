import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEnvironmentBaseUrl,
  getEnvironmentVariablesMap,
  EnvironmentVariable,
} from '@/src/client/domain/environment/entity/environment';
import { toEnvironmentDomain } from '@/src/server/environment/environment.mapper';

describe('Environment Variables & Helpers', () => {
  it('should resolve base URL from variables list', () => {
    const vars: EnvironmentVariable[] = [
      { id: '1', key: 'apiKey', value: 'secret-123', type: 'secret', enabled: true },
      { id: '2', key: 'baseUrl', value: 'https://staging-api.example.com', type: 'plain', enabled: true },
    ];

    expect(getEnvironmentBaseUrl({ variables: vars })).toBe('https://staging-api.example.com');
  });

  it('should ignore disabled baseUrl variable', () => {
    const vars: EnvironmentVariable[] = [
      { id: '2', key: 'baseUrl', value: 'https://staging-api.example.com', type: 'plain', enabled: false },
    ];

    expect(getEnvironmentBaseUrl({ variables: vars })).toBe('');
  });

  it('should extract active variables map ignoring disabled variables', () => {
    const vars: EnvironmentVariable[] = [
      { id: '1', key: 'API_KEY', value: 'secret-key-xyz', type: 'secret', enabled: true },
      { id: '2', key: 'AUTH_USER', value: 'admin', type: 'plain', enabled: true },
      { id: '3', key: 'AUTH_PASS', value: 'password123', type: 'secret', enabled: true },
      { id: '4', key: 'UNUSED_FLAG', value: 'disabled_val', type: 'plain', enabled: false },
    ];

    const map = getEnvironmentVariablesMap({ variables: vars });
    expect(map).toEqual({
      API_KEY: 'secret-key-xyz',
      AUTH_USER: 'admin',
      AUTH_PASS: 'password123',
    });
  });

  it('should parse variables JSON in toEnvironmentDomain', () => {
    const rawEnv = {
      id: 'env-1',
      projectId: 'proj-1',
      name: 'Production',
      environmentType: 'PRODUCTION',
      variables: [
        { id: 'v1', key: 'baseUrl', value: 'https://prod.example.com', type: 'plain', enabled: true },
        { id: 'v2', key: 'TOKEN', value: 'jwt_prod_token', type: 'secret', enabled: true },
      ],
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const domain = toEnvironmentDomain(rawEnv);
    expect(domain.variables).toHaveLength(2);
    expect(domain.baseUrl).toBe('https://prod.example.com');
    expect(domain.variables[1].key).toBe('TOKEN');
  });

  it('should handle JSON string variables in toEnvironmentDomain', () => {
    const rawEnv = {
      id: 'env-2',
      projectId: 'proj-1',
      name: 'Staging',
      environmentType: 'STAGING',
      variables: JSON.stringify([
        { id: 'v1', key: 'baseUrl', value: 'https://stg.example.com', type: 'plain', enabled: true },
      ]),
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const domain = toEnvironmentDomain(rawEnv);
    expect(domain.variables).toHaveLength(1);
    expect(domain.baseUrl).toBe('https://stg.example.com');
  });

  it('should successfully fetch environments from database via getAllEnvironments', async () => {
    const { getAllEnvironments } = await import('@/src/server/environment/environment.repository');
    const list = await getAllEnvironments();
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('variables');
      expect(Array.isArray(list[0].variables)).toBe(true);
    }
  });
});
