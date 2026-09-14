// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '@/src/client/presentation/views/settings/hook/useSettings';
import { useAuthStore } from '@/src/client/presentation/stores/authStore';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

describe('useSettings', () => {
  let mockDbResetUseCase: any;

  beforeEach(() => {
    mockDbResetUseCase = {
      resetDatabase: vi.fn().mockResolvedValue(undefined),
    };
    useUIStore.setState({ toasts: [] });
    useAuthStore.setState({ session: { username: 'admin', role: 'ADMIN' } as any, isAuthenticated: true });
    vi.restoreAllMocks();
  });

  it('should process .sql backup file and extract summary', async () => {
    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    const sqlContent = 'INSERT INTO projects VALUES (1);\nINSERT INTO apis VALUES (1);';
    const file = new File([sqlContent], 'backup.sql', { type: 'text/plain' });

    await act(async () => {
      await result.current.handleFileDrop(file);
    });

    expect(result.current.fileName).toBe('backup.sql');
    expect(result.current.fileError).toBeNull();
    expect(result.current.fileSummary).toEqual({
      format: 'sql',
      statementsCount: 2,
      lineCount: 2,
    });
  });

  it('should process .json backup file and extract summary', async () => {
    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    const jsonContent = JSON.stringify({
      projects: [{ id: 'p1' }],
      apiCollections: [{ id: 'a1' }],
      requestScenarios: [{ id: 'r1' }],
      responseScenarios: [{ id: 'res1' }],
    });
    const file = new File([jsonContent], 'backup.json', { type: 'application/json' });

    await act(async () => {
      await result.current.handleFileDrop(file);
    });

    expect(result.current.fileName).toBe('backup.json');
    expect(result.current.fileError).toBeNull();
    expect(result.current.fileSummary).toEqual({
      format: 'json',
      projects: 1,
      apis: 1,
      scenarios: 2,
    });
  });

  it('should reject invalid file extensions', async () => {
    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    const file = new File(['data'], 'invalid.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.handleFileDrop(file);
    });

    expect(result.current.fileError).toBe('Invalid file type. Please upload a .sql or .json database backup file.');
    expect(result.current.selectedFile).toBeNull();
  });

  it('should handle backup download', async () => {
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeObjectURLSpy;

    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['SQL']),
      headers: { get: () => 'attachment; filename="backup.sql"' },
    } as any);

    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    await act(async () => {
      await result.current.handleDownloadBackup('sql');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/database/export?format=sql');
    expect(useUIStore.getState().toasts[0].title).toBe('Database Backup Downloaded');
  });

  it('should handle database reset when user is ADMIN', async () => {
    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    await act(async () => {
      await result.current.handleReset();
    });

    expect(mockDbResetUseCase.resetDatabase).toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0].title).toBe('Database Wiped');
  });

  it('should deny database reset when user role is not allowed', async () => {
    useAuthStore.setState({ session: { username: 'viewer', role: 'VIEWER' } as any, isAuthenticated: true });

    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    await act(async () => {
      await result.current.handleReset();
    });

    expect(mockDbResetUseCase.resetDatabase).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0].title).toBe('Permission Denied');
  });

  it('should deny backup download and import when user role is not Manager or Admin', async () => {
    useAuthStore.setState({ session: { username: 'dev', role: 'Backend Developer' } as any, isAuthenticated: true });

    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    expect(result.current.canBackupRestoreDb).toBe(false);

    await act(async () => {
      await result.current.handleDownloadBackup('sql');
    });

    expect(useUIStore.getState().toasts[0].title).toBe('Permission Denied');
  });

  it('should allow backup restore and reset for Manager role', async () => {
    useAuthStore.setState({ session: { username: 'mgr', role: 'Manager' } as any, isAuthenticated: true });

    const { result } = renderHook(() => useSettings(mockDbResetUseCase));

    expect(result.current.canBackupRestoreDb).toBe(true);
    expect(result.current.canResetDb).toBe(true);
  });
});
