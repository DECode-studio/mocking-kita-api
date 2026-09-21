// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnvironments } from '@/src/client/presentation/views/environments/hook/useEnvironments';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

let mockEnvUseCase: any;
let mockProjectUseCase: any;

vi.mock('@/src/core/di', () => ({
  CLIENT_DI_TOKENS: {
    environmentUseCase: 'environmentUseCase',
    projectUseCase: 'projectUseCase',
  },
  getService: (token: any) => {
    if (token === 'environmentUseCase' || token?.name === 'environmentUseCase') return mockEnvUseCase;
    if (token === 'projectUseCase' || token?.name === 'projectUseCase') return mockProjectUseCase;
    return mockEnvUseCase;
  },
}));

describe('useEnvironments Hook (Matrix Model)', () => {
  const mockEnvironments = [
    {
      id: 'env-1',
      name: 'Platform AUTH',
      projectId: 'proj-1',
      isBaseUrl: true,
      values: {
        LOCAL: null,
        DEVELOPMENT: 'https://auth-dev.example.com',
        STAGING: 'https://auth-staging.example.com',
        PRODUCTION: 'https://auth.example.com',
      },
      status: true,
      variables: [],
    },
    {
      id: 'env-2',
      name: 'App Credentials',
      projectId: 'proj-1',
      isBaseUrl: false,
      values: {
        LOCAL: 'local-secret-123',
        DEVELOPMENT: 'dev-secret-456',
      },
      status: true,
      variables: [{ key: 'API_KEY', value: 'xyz', type: 'secret', enabled: true }],
    },
  ];

  const mockProjects = [
    { id: 'proj-1', name: 'Project One' },
  ];

  beforeEach(() => {
    mockEnvUseCase = {
      getAll: vi.fn().mockResolvedValue(mockEnvironments),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'env-new', ...data })),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      softDelete: vi.fn().mockResolvedValue(undefined),
    };

    mockProjectUseCase = {
      getAll: vi.fn().mockResolvedValue(mockProjects),
    };

    useUIStore.setState({ toasts: [] });
  });

  it('should load matrix environments and filter by query', async () => {
    const { result } = renderHook(() => useEnvironments());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.environments).toHaveLength(2);

    // Filter by stage value search
    act(() => {
      result.current.setSearchQuery('auth-staging');
    });
    expect(result.current.environments).toHaveLength(1);
    expect(result.current.environments[0].name).toBe('Platform AUTH');
  });

  it('should pass isBaseUrl and matrix values when creating new environment', async () => {
    const { result } = renderHook(() => useEnvironments());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleSaveEnvironment({
        name: 'KPM Service',
        projectId: 'proj-1',
        isBaseUrl: true,
        values: {
          LOCAL: null,
          DEVELOPMENT: 'https://kpm-dev.example.com',
          STAGING: 'https://kpm-staging.example.com',
        },
        status: true,
        variables: [],
      });
    });

    expect(mockEnvUseCase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'KPM Service',
        isBaseUrl: true,
        values: expect.objectContaining({
          LOCAL: null,
          DEVELOPMENT: 'https://kpm-dev.example.com',
          STAGING: 'https://kpm-staging.example.com',
        }),
      })
    );
  });

  it('should pass isBaseUrl and matrix values when updating an existing environment', async () => {
    const { result } = renderHook(() => useEnvironments());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleOpenEditModal(mockEnvironments[0] as any);
    });

    await act(async () => {
      await result.current.handleSaveEnvironment({
        name: 'Platform AUTH v2',
        projectId: 'proj-1',
        isBaseUrl: true,
        values: {
          LOCAL: null,
          DEVELOPMENT: 'https://auth-dev2.example.com',
        },
        status: true,
        variables: [],
      });
    });

    expect(mockEnvUseCase.update).toHaveBeenCalledWith(
      'env-1',
      expect.objectContaining({
        name: 'Platform AUTH v2',
        isBaseUrl: true,
        values: expect.objectContaining({
          DEVELOPMENT: 'https://auth-dev2.example.com',
        }),
      })
    );
  });
});
