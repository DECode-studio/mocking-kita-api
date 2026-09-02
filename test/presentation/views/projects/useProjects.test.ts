// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjects } from '@/src/presentation/views/projects/hook/useProjects';
import { useUIStore } from '@/src/presentation/stores/uiStore';

const mockReplace = vi.fn();
let mockSearchParamNew = 'false';

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects',
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'new' ? mockSearchParamNew : null),
  }),
}));

describe('useProjects', () => {
  let mockProjectUseCase: any;

  const initialProjects = [
    { id: 'p1', name: 'Alpha', description: 'First project', status: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '' },
    { id: 'p2', name: 'Beta', description: 'Second project', status: false, createdAt: '2026-02-01T00:00:00Z', updatedAt: '' },
    { id: 'p3', name: 'Deleted Project', status: false, deletedAt: '2026-02-05T00:00:00Z', createdAt: '2026-01-05T00:00:00Z', updatedAt: '' },
  ] as any[];

  beforeEach(() => {
    mockSearchParamNew = 'false';
    mockProjectUseCase = {
      getAll: vi.fn().mockResolvedValue(initialProjects),
      create: vi.fn().mockResolvedValue({ id: 'p4', name: 'Gamma' }),
      update: vi.fn().mockResolvedValue({ id: 'p1', name: 'Alpha Updated' }),
      duplicate: vi.fn().mockResolvedValue({ id: 'p1-copy', name: 'Alpha (Copy)' }),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(undefined),
      hardDelete: vi.fn().mockResolvedValue(undefined),
      toggleStatus: vi.fn().mockResolvedValue(undefined),
    };
    useUIStore.setState({ toasts: [] });
    mockReplace.mockReset();
  });

  it('should initialize and filter/sort projects', () => {
    const { result } = renderHook(() => useProjects(mockProjectUseCase, initialProjects));

    // Default sortBy is 'date' descending (Beta created Feb, Alpha created Jan)
    expect(result.current.filteredProjects).toHaveLength(2); // p3 is deleted, omitted when statusFilter is 'ALL'
    expect(result.current.filteredProjects[0].id).toBe('p2');

    // Change sortBy to name
    act(() => {
      result.current.setSortBy('name');
    });
    expect(result.current.filteredProjects[0].name).toBe('Alpha');

    // Filter by DELETED
    act(() => {
      result.current.setStatusFilter('DELETED');
    });
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].id).toBe('p3');
  });

  it('should open add dialog if ?new=true query param is present', () => {
    mockSearchParamNew = 'true';
    const { result } = renderHook(() => useProjects(mockProjectUseCase, initialProjects));

    expect(result.current.isFormOpen).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/projects');
  });

  it('should create new project on form submit', async () => {
    const { result } = renderHook(() => useProjects(mockProjectUseCase, initialProjects));

    act(() => {
      result.current.openAddDialog();
    });

    await act(async () => {
      await result.current.onSubmitForm({ name: 'Gamma Project', description: 'New', status: true });
    });

    expect(mockProjectUseCase.create).toHaveBeenCalledWith({
      name: 'Gamma Project',
      description: 'New',
      status: true,
    });
    expect(result.current.isFormOpen).toBe(false);
  });

  it('should duplicate project', async () => {
    const { result } = renderHook(() => useProjects(mockProjectUseCase, initialProjects));

    await act(async () => {
      await result.current.handleDuplicate(initialProjects[0]);
    });

    expect(mockProjectUseCase.duplicate).toHaveBeenCalledWith('p1');
  });

  it('should soft delete, restore, and confirm hard delete project', async () => {
    const { result } = renderHook(() => useProjects(mockProjectUseCase, initialProjects));

    // Soft delete
    await act(async () => {
      await result.current.handleSoftDelete('p1');
    });
    expect(mockProjectUseCase.softDelete).toHaveBeenCalledWith('p1');

    // Restore
    await act(async () => {
      await result.current.handleRestore('p3');
    });
    expect(mockProjectUseCase.restore).toHaveBeenCalledWith('p3');

    // Hard delete
    act(() => {
      result.current.setDeletingProject({ id: 'p3', name: 'Deleted Project', isPermanent: true });
    });

    await act(async () => {
      await result.current.handleConfirmHardDelete();
    });

    expect(mockProjectUseCase.hardDelete).toHaveBeenCalledWith('p3');
    expect(result.current.deletingProject).toBeNull();
  });
});
