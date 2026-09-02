// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnvironments } from '@/src/presentation/views/environments/hook/useEnvironments';
import { useUIStore } from '@/src/presentation/stores/uiStore';

describe('useEnvironments', () => {
  let mockEnvUseCase: any;

  const initialEnvironments = [
    {
      id: 'env-1',
      projectId: 'proj-1',
      name: 'Development',
      environmentType: 'DEVELOPMENT',
      publicBaseUrl: 'http://localhost:3000',
      originBaseUrl: 'http://localhost:8080',
      status: true,
      createdAt: '',
      updatedAt: '',
    },
  ] as any[];

  const initialProject = { id: 'proj-1', name: 'Mock Project' } as any;

  beforeEach(() => {
    mockEnvUseCase = {
      load: vi.fn().mockResolvedValue({ environments: initialEnvironments, project: initialProject }),
      create: vi.fn().mockResolvedValue({ id: 'env-2' }),
      update: vi.fn().mockResolvedValue({ id: 'env-1' }),
      softDelete: vi.fn().mockResolvedValue(undefined),
      toggleStatus: vi.fn().mockResolvedValue(undefined),
    };
    useUIStore.setState({ toasts: [] });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should initialize state with provided values', () => {
    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    expect(result.current.environments).toHaveLength(1);
    expect(result.current.project).toEqual(initialProject);
  });

  it('should handle openAddDialog and openEditDialog', () => {
    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    act(() => {
      result.current.openAddDialog();
    });
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editingEnv).toBeNull();

    act(() => {
      result.current.openEditDialog(initialEnvironments[0]);
    });
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editingEnv).toEqual(initialEnvironments[0]);
  });

  it('should reject duplicate environment name submit', async () => {
    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    await act(async () => {
      await result.current.onSubmitForm({
        name: 'Development',
        environmentType: 'DEVELOPMENT',
        publicBaseUrl: 'http://localhost:3000',
        originBaseUrl: '',
        status: true,
      });
    });

    expect(mockEnvUseCase.create).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0].title).toBe('Duplicate Name');
  });

  it('should create new environment when valid', async () => {
    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    await act(async () => {
      await result.current.onSubmitForm({
        name: 'Staging',
        environmentType: 'STAGING',
        publicBaseUrl: 'https://staging.example.com',
        originBaseUrl: '',
        status: true,
      });
    });

    expect(mockEnvUseCase.create).toHaveBeenCalledWith({
      projectId: 'proj-1',
      name: 'Staging',
      environmentType: 'STAGING',
      publicBaseUrl: 'https://staging.example.com',
      originBaseUrl: undefined,
      status: true,
    });
  });

  it('should copy URL to clipboard', () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    act(() => {
      result.current.handleCopyUrl('https://staging.example.com', 'field-1');
    });

    expect(writeTextSpy).toHaveBeenCalledWith('https://staging.example.com');
    expect(result.current.copiedField).toBe('field-1');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiedField).toBeNull();
  });

  it('should delete environment', async () => {
    const { result } = renderHook(() =>
      useEnvironments(mockEnvUseCase, 'proj-1', initialEnvironments, initialProject)
    );

    act(() => {
      result.current.setDeletingEnvId('env-1');
    });

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockEnvUseCase.softDelete).toHaveBeenCalledWith('env-1');
    expect(result.current.deletingEnvId).toBeNull();
  });
});
