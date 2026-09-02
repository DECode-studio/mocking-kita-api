// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnvironmentOverrideActions } from '@/src/presentation/views/api-detail/hook/useEnvironmentOverrideActions';

describe('useEnvironmentOverrideActions', () => {
  const projectEnvs = [
    { id: 'env-1', projectId: 'p1', name: 'Dev', publicBaseUrl: 'http://localhost:3000' },
    { id: 'env-2', projectId: 'p1', name: 'Staging', publicBaseUrl: 'https://staging.example.com' },
  ] as any[];

  const apiEnvironments = [
    { apiId: 'api-1', environmentId: 'env-1', enabled: false, pathOverride: '/custom-path' },
  ] as any[];

  it('should compute environmentRows with correct resolution logic', () => {
    const upsertApiEnvironment = vi.fn();
    const { result } = renderHook(() =>
      useEnvironmentOverrideActions({
        apiId: 'api-1',
        apiPath: '/users',
        projectEnvs,
        apiEnvironments,
        upsertApiEnvironment,
      })
    );

    expect(result.current.environmentRows).toHaveLength(2);

    const row1 = result.current.environmentRows[0];
    expect(row1.isEnabled).toBe(false);
    expect(row1.pathOverride).toBe('/custom-path');
    expect(row1.resolvedUrl).toBe('http://localhost:3000/api/mock/p1/custom-path');

    const row2 = result.current.environmentRows[1];
    expect(row2.isEnabled).toBe(true);
    expect(row2.resolvedPath).toBe('/users');
    expect(row2.resolvedUrl).toBe('https://staging.example.com/users');
  });

  it('should handle toggle enabled', async () => {
    const upsertApiEnvironment = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useEnvironmentOverrideActions({
        apiId: 'api-1',
        apiPath: '/users',
        projectEnvs,
        apiEnvironments,
        upsertApiEnvironment,
      })
    );

    await act(async () => {
      await result.current.handleToggleEnabled('env-2', false, '');
    });

    expect(upsertApiEnvironment).toHaveBeenCalledWith({
      apiId: 'api-1',
      environmentId: 'env-2',
      enabled: false,
      pathOverride: '',
    });
  });

  it('should handle update path override', async () => {
    const upsertApiEnvironment = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useEnvironmentOverrideActions({
        apiId: 'api-1',
        apiPath: '/users',
        projectEnvs,
        apiEnvironments,
        upsertApiEnvironment,
      })
    );

    await act(async () => {
      await result.current.handleUpdatePathOverride('env-2', true, ' /new-path ');
    });

    expect(upsertApiEnvironment).toHaveBeenCalledWith({
      apiId: 'api-1',
      environmentId: 'env-2',
      enabled: true,
      pathOverride: '/new-path',
    });
  });
});
