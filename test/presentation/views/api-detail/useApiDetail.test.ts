// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiDetail } from '@/src/presentation/views/api-detail/hook/useApiDetail';
import { useUIStore } from '@/src/presentation/stores/uiStore';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'proj-1', apiId: 'api-1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('useApiDetail', () => {
  let mockApiDetailUseCase: any;

  const initialDetailSnapshot = {
    project: { id: 'proj-1', name: 'Project 1' },
    api: { id: 'api-1', name: 'Get Users', path: '/users', methodRequest: 'GET' },
    projectEnvs: [{ id: 'env-1', publicBaseUrl: 'http://localhost:3000' }],
    apiEnvironments: [],
    requestScenarios: [{ id: 'req-1', name: 'Default Req', priority: 1, status: true }],
    responseScenarios: [{ id: 'res-1', requestScenarioId: 'req-1', name: '200 OK', status: true }],
    activeResponseScenarios: [{ id: 'res-1', requestScenarioId: 'req-1', name: '200 OK', status: true }],
    activeReqScenario: { id: 'req-1', name: 'Default Req', priority: 1, status: true },
  } as any;

  beforeEach(() => {
    mockApiDetailUseCase = {
      load: vi.fn().mockResolvedValue(initialDetailSnapshot),
      toggleApiStatus: vi.fn().mockResolvedValue(undefined),
      createRequestScenario: vi.fn().mockResolvedValue({ id: 'req-2', name: 'New Req' }),
      updateRequestScenario: vi.fn().mockResolvedValue({ id: 'req-1' }),
      toggleRequestScenarioStatus: vi.fn().mockResolvedValue(undefined),
      duplicateRequestScenario: vi.fn().mockResolvedValue(undefined),
      deleteRequestScenario: vi.fn().mockResolvedValue(undefined),
      createResponseScenario: vi.fn().mockResolvedValue({ id: 'res-2' }),
      updateResponseScenario: vi.fn().mockResolvedValue({ id: 'res-1' }),
      toggleResponseScenarioStatus: vi.fn().mockResolvedValue(undefined),
      duplicateResponseScenario: vi.fn().mockResolvedValue(undefined),
      deleteResponseScenario: vi.fn().mockResolvedValue(undefined),
      upsertApiEnvironment: vi.fn().mockResolvedValue(undefined),
      uploadResponseFile: vi.fn().mockResolvedValue({ filePath: '/file.png', fileName: 'file.png' }),
    };
    useUIStore.setState({ toasts: [] });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should initialize with snapshot detail state', async () => {
    const { result } = renderHook(() => useApiDetail(mockApiDetailUseCase, initialDetailSnapshot));

    expect(result.current.api).toEqual(initialDetailSnapshot.api);
    expect(result.current.activeReqScenario).toEqual(initialDetailSnapshot.activeReqScenario);
    expect(result.current.respScenarios).toEqual(initialDetailSnapshot.activeResponseScenarios);
  });

  it('should handle request scenario creation and select new id', async () => {
    const { result } = renderHook(() => useApiDetail(mockApiDetailUseCase, initialDetailSnapshot));

    await act(async () => {
      const created = await result.current.createRequestScenario({ name: 'New Req' });
      expect(created.id).toBe('req-2');
    });

    expect(result.current.selectedReqScenarioId).toBe('req-2');
  });

  it('should toggle API status and reload detail', async () => {
    const { result } = renderHook(() => useApiDetail(mockApiDetailUseCase, initialDetailSnapshot));

    await act(async () => {
      await result.current.toggleApiCollectionStatus('api-1');
    });

    expect(mockApiDetailUseCase.toggleApiStatus).toHaveBeenCalledWith('api-1');
    expect(mockApiDetailUseCase.load).toHaveBeenCalledWith('proj-1', 'api-1', null);
  });

  it('should copy resolved URL to clipboard and show toast', () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useApiDetail(mockApiDetailUseCase, initialDetailSnapshot));

    act(() => {
      result.current.handleCopyResolvedUrl('http://localhost:3000/api/mock/proj-1/users');
    });

    expect(writeTextSpy).toHaveBeenCalledWith('http://localhost:3000/api/mock/proj-1/users');
    expect(result.current.copiedUrl).toBe('http://localhost:3000/api/mock/proj-1/users');
    expect(useUIStore.getState().toasts[0].title).toBe('Copied Resolved Mock URL');
  });

  it('should delegate scenario operations to usecase', async () => {
    const { result } = renderHook(() => useApiDetail(mockApiDetailUseCase, initialDetailSnapshot));

    await act(async () => {
      await result.current.toggleRequestScenarioStatus('req-1');
      await result.current.duplicateRequestScenario('req-1');
      await result.current.deleteRequestScenario('req-1');
      await result.current.toggleResponseScenarioStatus('res-1');
      await result.current.duplicateResponseScenario('res-1');
      await result.current.deleteResponseScenario('res-1');
    });

    expect(mockApiDetailUseCase.toggleRequestScenarioStatus).toHaveBeenCalledWith('req-1');
    expect(mockApiDetailUseCase.duplicateRequestScenario).toHaveBeenCalledWith('req-1');
    expect(mockApiDetailUseCase.deleteRequestScenario).toHaveBeenCalledWith('req-1');
    expect(mockApiDetailUseCase.toggleResponseScenarioStatus).toHaveBeenCalledWith('res-1');
    expect(mockApiDetailUseCase.duplicateResponseScenario).toHaveBeenCalledWith('res-1');
    expect(mockApiDetailUseCase.deleteResponseScenario).toHaveBeenCalledWith('res-1');
  });
});
