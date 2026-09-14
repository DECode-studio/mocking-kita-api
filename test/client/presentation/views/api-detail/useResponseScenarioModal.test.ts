// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponseScenarioModal } from '@/src/client/presentation/views/api-detail/hook/useResponseScenarioModal';

describe('useResponseScenarioModal', () => {
  it('should initialize default state for create mode', () => {
    const onSubmit = vi.fn();
    const onUploadFile = vi.fn();
    const { result } = renderHook(() =>
      useResponseScenarioModal({ isOpen: true, editingRespScenario: null, onSubmit, onUploadFile })
    );

    expect(result.current.name).toBe('');
    expect(result.current.statusCode).toBe(200);
    expect(result.current.responseType).toBe('JSON');
  });

  it('should initialize state from editingRespScenario', () => {
    const onSubmit = vi.fn();
    const onUploadFile = vi.fn();
    const editing = {
      name: 'Custom Response',
      statusCode: 404,
      priority: 50,
      weight: 50,
      body: { error: 'Not found' },
      delayMs: 500,
      status: true,
      responseType: 'JSON',
    } as any;

    const { result } = renderHook(() =>
      useResponseScenarioModal({ isOpen: true, editingRespScenario: editing, onSubmit, onUploadFile })
    );

    expect(result.current.name).toBe('Custom Response');
    expect(result.current.statusCode).toBe(404);
    expect(result.current.delayMs).toBe(500);
  });

  it('should handle file upload and file removal', async () => {
    const onSubmit = vi.fn();
    const onUploadFile = vi.fn().mockResolvedValue({ filePath: '/uploads/a.png', fileName: 'a.png' });

    const { result } = renderHook(() =>
      useResponseScenarioModal({ isOpen: true, editingRespScenario: null, onSubmit, onUploadFile })
    );

    const file = new File(['img'], 'a.png', { type: 'image/png' });
    await act(async () => {
      await result.current.handleFileUpload(file);
    });

    expect(onUploadFile).toHaveBeenCalledWith(file);
    expect(result.current.filePath).toBe('/uploads/a.png');
    expect(result.current.fileName).toBe('a.png');

    act(() => {
      result.current.removeFile();
    });

    expect(result.current.filePath).toBeNull();
    expect(result.current.fileName).toBeNull();
  });

  it('should ignore duplicate uploads while one is already in progress', async () => {
    const onSubmit = vi.fn();
    let resolveUpload: (value: { filePath: string; fileName: string }) => void = () => undefined;
    const onUploadFile = vi.fn(
      () =>
        new Promise<{ filePath: string; fileName: string }>((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { result } = renderHook(() =>
      useResponseScenarioModal({ isOpen: true, editingRespScenario: null, onSubmit, onUploadFile })
    );

    const firstFile = new File(['img'], 'a.png', { type: 'image/png' });
    const secondFile = new File(['img'], 'b.png', { type: 'image/png' });

    let firstUpload: Promise<void> = Promise.resolve();
    await act(async () => {
      firstUpload = result.current.handleFileUpload(firstFile);
      await result.current.handleFileUpload(secondFile);
    });

    expect(onUploadFile).toHaveBeenCalledTimes(1);
    expect(onUploadFile).toHaveBeenCalledWith(firstFile);

    await act(async () => {
      resolveUpload({ filePath: '/uploads/a.png', fileName: 'a.png' });
      await firstUpload;
    });

    expect(result.current.fileName).toBe('a.png');
  });

  it('should handle drag and drop events', async () => {
    const onSubmit = vi.fn();
    const onUploadFile = vi.fn().mockResolvedValue({ filePath: '/uploads/b.png', fileName: 'b.png' });

    const { result } = renderHook(() =>
      useResponseScenarioModal({ isOpen: true, editingRespScenario: null, onSubmit, onUploadFile })
    );

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleDragOver({ preventDefault } as any);
    });
    expect(result.current.dragOver).toBe(true);

    act(() => {
      result.current.handleDragLeave();
    });
    expect(result.current.dragOver).toBe(false);

    const file = new File(['img'], 'b.png', { type: 'image/png' });
    await act(async () => {
      await result.current.handleDrop({
        preventDefault,
        dataTransfer: { files: [file] },
      } as any);
    });

    expect(result.current.fileName).toBe('b.png');
  });
});
