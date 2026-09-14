// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpenApi } from '@/src/client/presentation/views/project-detail/hook/useOpenApi';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe('useOpenApi', () => {
  let mockProjectUseCase: any;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockProjectUseCase = {
      exportOpenApi: vi.fn().mockResolvedValue({ openapi: '3.0.0', info: { title: 'Test' } }),
      importOpenApi: vi.fn().mockResolvedValue({ success: true, importedApiCount: 5, importedCollectionCount: 1 }),
    };
    mockOnClose.mockReset();
    mockRefresh.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should initialize with default export tab state', () => {
    const { result } = renderHook(() =>
      useOpenApi({ projectId: 'p1', projectName: 'My API', onClose: mockOnClose, projectUseCase: mockProjectUseCase })
    );

    expect(result.current.activeTab).toBe('export');
    expect(result.current.importMode).toBe('upsert');
    expect(result.current.jsonText).toBe('');
  });

  it('should change active tab and reset messages', () => {
    const { result } = renderHook(() =>
      useOpenApi({ projectId: 'p1', projectName: 'My API', onClose: mockOnClose, projectUseCase: mockProjectUseCase })
    );

    act(() => {
      result.current.changeTab('import');
    });

    expect(result.current.activeTab).toBe('import');
  });

  it('should handle export openapi spec', async () => {
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeObjectURLSpy;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);

    const { result } = renderHook(() =>
      useOpenApi({ projectId: 'p1', projectName: 'My API', onClose: mockOnClose, projectUseCase: mockProjectUseCase })
    );

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockProjectUseCase.exportOpenApi).toHaveBeenCalledWith('p1');
    expect(result.current.successMsg).toBe('OpenAPI specification downloaded successfully.');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should reject handleImport if jsonText is empty', async () => {
    const { result } = renderHook(() =>
      useOpenApi({ projectId: 'p1', projectName: 'My API', onClose: mockOnClose, projectUseCase: mockProjectUseCase })
    );

    act(() => {
      result.current.changeTab('import');
    });

    await act(async () => {
      await result.current.handleImport();
    });

    expect(result.current.errorMsg).toBe('Please select a JSON file or paste an OpenAPI JSON specification.');
  });

  it('should process import successfully', async () => {
    const { result } = renderHook(() =>
      useOpenApi({ projectId: 'p1', projectName: 'My API', onClose: mockOnClose, projectUseCase: mockProjectUseCase })
    );

    act(() => {
      result.current.setJsonText(JSON.stringify({ openapi: '3.0.0' }));
    });

    await act(async () => {
      await result.current.handleImport();
    });

    expect(mockProjectUseCase.importOpenApi).toHaveBeenCalledWith('p1', { openapi: '3.0.0' }, 'upsert');
    expect(result.current.successMsg).toContain('Successfully imported 5 endpoints & 1 collections.');

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(mockRefresh).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
