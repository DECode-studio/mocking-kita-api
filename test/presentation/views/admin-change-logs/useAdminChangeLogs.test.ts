// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminChangeLogs } from '@/src/presentation/views/admin-change-logs/hook/useAdminChangeLogs';
import * as useCaseProvider from '@/src/di/usecase_provider';

describe('useAdminChangeLogs', () => {
  let mockChangeLogUseCase: any;
  let mockProjectUseCase: any;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockChangeLogUseCase = {
      getChangeLogs: vi.fn().mockResolvedValue({
        changeLogs: [{ id: 'log-1', action: 'CREATE', entity: 'PROJECT' }],
        totalCount: 30,
      }),
    };
    mockProjectUseCase = {
      getAll: vi.fn().mockResolvedValue([{ id: 'proj-1', name: 'Project 1' }]),
    };

    vi.spyOn(useCaseProvider, 'createChangeLogUseCase').mockReturnValue(mockChangeLogUseCase);
    vi.spyOn(useCaseProvider, 'createProjectUseCase').mockReturnValue(mockProjectUseCase);
  });

  it('should load projects and change logs on mount', async () => {
    const { result } = renderHook(() => useAdminChangeLogs());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toEqual([{ id: 'proj-1', name: 'Project 1' }]);
    expect(result.current.changeLogs).toHaveLength(1);
    expect(result.current.totalCount).toBe(30);
    expect(result.current.totalPages).toBe(2); // 30 / 15
  });

  it('should debounce search and reset page to 1', async () => {
    const { result } = renderHook(() => useAdminChangeLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);

    act(() => {
      result.current.setSearch('new search');
    });

    // Before timer fires
    expect(result.current.search).toBe('new search');

    // Advance 400ms debounce timer
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockChangeLogUseCase.getChangeLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'new search' })
      );
    });
  });

  it('should reset page on actionFilter or projectFilter changes', async () => {
    const { result } = renderHook(() => useAdminChangeLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setActionFilter('CREATE');
    });

    expect(result.current.page).toBe(1);
  });

  it('should open and close active log details modal', async () => {
    const { result } = renderHook(() => useAdminChangeLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sampleLog = { id: 'log-1', action: 'CREATE' } as any;

    act(() => {
      result.current.openLogDetails(sampleLog);
    });

    expect(result.current.activeLogDetails).toEqual(sampleLog);

    act(() => {
      result.current.closeLogDetails();
    });

    expect(result.current.activeLogDetails).toBeNull();
  });

  it('should set error state if fetch fails', async () => {
    mockChangeLogUseCase.getChangeLogs.mockRejectedValue(new Error('Fetch error'));
    const { result } = renderHook(() => useAdminChangeLogs());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Fetch error');
  });
});
