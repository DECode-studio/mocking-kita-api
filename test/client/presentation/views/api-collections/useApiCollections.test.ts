// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiCollections } from '@/src/client/presentation/views/api-collections/hook/useApiCollections';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

describe('useApiCollections', () => {
  let mockApiUseCase: any;
  let mockCollectionUseCase: any;

  const initialApis = [
    { id: 'api-1', name: 'Get Users', path: '/api/users', methodRequest: 'GET', status: true, collectionId: 'col-1' },
    { id: 'api-2', name: 'Create User', path: '/api/users', methodRequest: 'POST', status: false, collectionId: null },
  ] as any[];

  const initialCollections = [
    { id: 'col-1', name: 'Users', description: 'User endpoints', projectId: 'proj-1', status: true },
  ] as any[];

  beforeEach(() => {
    mockApiUseCase = {
      load: vi.fn().mockResolvedValue({ apis: initialApis }),
      create: vi.fn().mockResolvedValue({ id: 'api-3' }),
      update: vi.fn().mockResolvedValue({ id: 'api-1' }),
      duplicate: vi.fn().mockResolvedValue({ id: 'api-1-copy', name: 'Get Users (Copy)' }),
      softDelete: vi.fn().mockResolvedValue(undefined),
      toggleStatus: vi.fn().mockResolvedValue(undefined),
    };
    mockCollectionUseCase = {
      getByProjectId: vi.fn().mockResolvedValue(initialCollections),
      create: vi.fn().mockResolvedValue({ id: 'col-2' }),
      update: vi.fn().mockResolvedValue({ id: 'col-1' }),
      softDelete: vi.fn().mockResolvedValue(undefined),
    };
    useUIStore.setState({ toasts: [] });
  });

  it('should initialize with initial state and perform filtering', () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    expect(result.current.apis).toHaveLength(2);
    expect(result.current.collections).toHaveLength(1);
    expect(result.current.filteredApis).toHaveLength(2);

    // Search filter
    act(() => {
      result.current.setSearch('Get');
    });
    expect(result.current.filteredApis).toHaveLength(1);

    // Method filter
    act(() => {
      result.current.setSearch('');
      result.current.setMethodFilter('POST');
    });
    expect(result.current.filteredApis).toHaveLength(1);
    expect(result.current.filteredApis[0].id).toBe('api-2');

    // Status filter
    act(() => {
      result.current.setMethodFilter('ALL');
      result.current.setStatusFilter('ACTIVE');
    });
    expect(result.current.filteredApis).toHaveLength(1);
    expect(result.current.filteredApis[0].id).toBe('api-1');
  });

  it('should handle openAddDialog and openEditDialog', () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    act(() => {
      result.current.openAddDialog();
    });
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editingApi).toBeNull();

    act(() => {
      result.current.openEditDialog(initialApis[0]);
    });
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editingApi).toEqual(initialApis[0]);
  });

  it('should block submitting duplicate API endpoint', async () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    await act(async () => {
      await result.current.onSubmitForm({
        name: 'Duplicate Test',
        path: '/api/users',
        methodRequest: 'GET',
        status: true,
        collectionId: null,
      });
    });

    expect(mockApiUseCase.create).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0].title).toBe('Duplicate Endpoint Definition');
  });

  it('should submit form and create new API endpoint', async () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    await act(async () => {
      await result.current.onSubmitForm({
        name: 'Get Products',
        path: '/api/products',
        methodRequest: 'GET',
        status: true,
        collectionId: null,
      });
    });

    expect(mockApiUseCase.create).toHaveBeenCalledWith({
      projectId: 'proj-1',
      name: 'Get Products',
      description: undefined,
      path: '/api/products',
      methodRequest: 'GET',
      picIds: [],
      status: true,
      collectionId: null,
    });
    expect(result.current.isFormOpen).toBe(false);
  });

  it('should duplicate API endpoint', async () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    await act(async () => {
      await result.current.handleDuplicate(initialApis[0]);
    });

    expect(mockApiUseCase.duplicate).toHaveBeenCalledWith('api-1');
  });

  it('should soft delete API endpoint', async () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    act(() => {
      result.current.setDeletingApiId('api-1');
    });

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockApiUseCase.softDelete).toHaveBeenCalledWith('api-1');
    expect(result.current.deletingApiId).toBeNull();
  });

  it('should create and delete collection', async () => {
    const { result } = renderHook(() =>
      useApiCollections(mockApiUseCase, mockCollectionUseCase, 'proj-1', initialApis, initialCollections)
    );

    act(() => {
      result.current.openAddCollectionDialog();
      result.current.setCollectionName('Orders Folder');
    });

    await act(async () => {
      await result.current.onSubmitCollectionForm();
    });

    expect(mockCollectionUseCase.create).toHaveBeenCalledWith({
      projectId: 'proj-1',
      name: 'Orders Folder',
      description: '',
      status: true,
    });

    act(() => {
      result.current.setDeletingCollectionId('col-1');
    });

    await act(async () => {
      await result.current.handleDeleteCollection();
    });

    expect(mockCollectionUseCase.softDelete).toHaveBeenCalledWith('col-1');
  });
});
