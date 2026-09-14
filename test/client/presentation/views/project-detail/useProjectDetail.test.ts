// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectDetail } from '@/src/client/presentation/views/project-detail/hook/useProjectDetail';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'proj-123' }),
  useRouter: () => ({ push: mockPush }),
}));

describe('useProjectDetail', () => {
  let mockProjectUseCase: any;
  const initialProject = { id: 'proj-123', name: 'Test Project', status: true } as any;

  beforeEach(() => {
    mockProjectUseCase = {
      getById: vi.fn().mockResolvedValue(initialProject),
      toggleStatus: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
    };
    useUIStore.setState({ toasts: [] });
    mockPush.mockReset();
  });

  it('should initialize with project state', () => {
    const { result } = renderHook(() => useProjectDetail(mockProjectUseCase, initialProject));

    expect(result.current.projectId).toBe('proj-123');
    expect(result.current.project).toEqual(initialProject);
    expect(result.current.activeTab).toBe('apis');
  });

  it('should change active tab', () => {
    const { result } = renderHook(() => useProjectDetail(mockProjectUseCase, initialProject));

    act(() => {
      result.current.setActiveTab('environments');
    });

    expect(result.current.activeTab).toBe('environments');
  });

  it('should handle toggleProjectStatus', async () => {
    const { result } = renderHook(() => useProjectDetail(mockProjectUseCase, initialProject));

    await act(async () => {
      await result.current.toggleProjectStatus('proj-123');
    });

    expect(mockProjectUseCase.toggleStatus).toHaveBeenCalledWith('proj-123');
    expect(mockProjectUseCase.getById).toHaveBeenCalledWith('proj-123');
  });

  it('should handle soft delete and navigate to projects route', async () => {
    const { result } = renderHook(() => useProjectDetail(mockProjectUseCase, initialProject));

    await act(async () => {
      await result.current.handleSoftDelete();
    });

    expect(mockProjectUseCase.softDelete).toHaveBeenCalledWith('proj-123');
    expect(useUIStore.getState().toasts[0].title).toBe('Project Soft Deleted');
    expect(mockPush).toHaveBeenCalledWith('/projects');
  });
});
