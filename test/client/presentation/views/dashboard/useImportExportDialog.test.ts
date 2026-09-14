// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImportExportDialog } from '@/src/client/presentation/views/dashboard/hook/useImportExportDialog';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { useAuthStore } from '@/src/client/presentation/stores/authStore';

describe('useImportExportDialog', () => {
  beforeEach(() => {
    useUIStore.setState({ isImportModalOpen: false, toasts: [] });
    useAuthStore.setState({ session: { username: 'admin', role: 'ADMIN' } as any, isAuthenticated: true });
    vi.restoreAllMocks();
  });

  it('should handle export action', async () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const { result } = renderHook(() => useImportExportDialog());

    await act(async () => {
      await result.current.handleExport();
    });

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0].title).toBe('Database Exported');
  });

  it('should reject non-json files in handleFileChange', () => {
    const { result } = renderHook(() => useImportExportDialog());

    const txtFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const dummyEvent = { target: { files: [txtFile] } } as any;

    act(() => {
      result.current.handleFileChange(dummyEvent);
    });

    expect(result.current.fileError).toBe('Invalid file type. Please upload a .json file.');
    expect(result.current.selectedFile).toBeNull();
  });

  it('should accept valid json file in handleFileChange', () => {
    const { result } = renderHook(() => useImportExportDialog());

    const jsonFile = new File(['{}'], 'backup.json', { type: 'application/json' });
    const dummyEvent = { target: { files: [jsonFile] } } as any;

    act(() => {
      result.current.handleFileChange(dummyEvent);
    });

    expect(result.current.fileError).toBeNull();
    expect(result.current.selectedFile).toBe(jsonFile);
    expect(result.current.fileName).toBe('backup.json');
  });

  it('should handle apply import success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useImportExportDialog());

    const jsonFile = new File(['{}'], 'backup.json', { type: 'application/json' });
    act(() => {
      result.current.handleFileChange({ target: { files: [jsonFile] } } as any);
    });

    await act(async () => {
      await result.current.handleApplyImport();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/database/import', expect.any(Object));
    expect(useUIStore.getState().toasts[0].title).toBe('Import Successful');
    expect(result.current.selectedFile).toBeNull();
  });

  it('should handle apply import error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Bad spec' }),
    } as Response);

    const { result } = renderHook(() => useImportExportDialog());

    const jsonFile = new File(['{}'], 'backup.json', { type: 'application/json' });
    act(() => {
      result.current.handleFileChange({ target: { files: [jsonFile] } } as any);
    });

    await act(async () => {
      await result.current.handleApplyImport();
    });

    expect(useUIStore.getState().toasts[0].title).toBe('Import Error');
  });

  it('should deny export and import for non-manager and non-admin roles', async () => {
    useAuthStore.setState({ session: { username: 'qa', role: 'Quality Assurance' } as any, isAuthenticated: true });

    const { result } = renderHook(() => useImportExportDialog());

    expect(result.current.canBackupRestoreDb).toBe(false);

    await act(async () => {
      await result.current.handleExport();
    });

    expect(useUIStore.getState().toasts[0].title).toBe('Permission Denied');
  });
});
