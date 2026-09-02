// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '@/src/presentation/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({
      toasts: [],
      globalSearch: '',
      isMobileSidebarOpen: false,
      isSidebarCollapsed: false,
      isImportModalOpen: false,
    });
  });

  it('should add and remove toasts', () => {
    useUIStore.getState().addToast({ type: 'success', title: 'Test Toast', description: 'Desc' });
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore.getState().toasts[0].title).toBe('Test Toast');

    const toastId = useUIStore.getState().toasts[0].id;
    useUIStore.getState().removeToast(toastId);
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('should automatically remove toast after timeout', () => {
    useUIStore.getState().addToast({ type: 'info', title: 'Auto remove' });
    expect(useUIStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('should update globalSearch', () => {
    useUIStore.getState().setGlobalSearch('query');
    expect(useUIStore.getState().globalSearch).toBe('query');
  });

  it('should toggle and set mobile sidebar state', () => {
    expect(useUIStore.getState().isMobileSidebarOpen).toBe(false);
    useUIStore.getState().toggleMobileSidebar();
    expect(useUIStore.getState().isMobileSidebarOpen).toBe(true);

    useUIStore.getState().setMobileSidebarOpen(false);
    expect(useUIStore.getState().isMobileSidebarOpen).toBe(false);
  });

  it('should toggle and set sidebar collapsed state', () => {
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebarCollapsed();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    useUIStore.getState().setSidebarCollapsed(false);
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });

  it('should toggle import modal state', () => {
    useUIStore.getState().setImportModalOpen(true);
    expect(useUIStore.getState().isImportModalOpen).toBe(true);
  });
});
