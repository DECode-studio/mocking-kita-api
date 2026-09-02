// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponseScenarioActions } from '@/src/presentation/views/api-detail/hook/useResponseScenarioActions';

describe('useResponseScenarioActions', () => {
  let deps: any;

  beforeEach(() => {
    deps = {
      activeReqScenarioId: 'req-1',
      editingRespScenarioId: null,
      setIsRespModalOpen: vi.fn(),
      setEditingRespScenario: vi.fn(),
      addToast: vi.fn(),
      createResponseScenario: vi.fn().mockResolvedValue({ id: 'res-1' }),
      updateResponseScenario: vi.fn().mockResolvedValue({ id: 'res-1' }),
    };
  });

  it('should not save if activeReqScenarioId is missing', async () => {
    deps.activeReqScenarioId = null;
    const { result } = renderHook(() => useResponseScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveRespScenario({
        name: 'Success',
        statusCode: 200,
        priority: 100,
        weight: 100,
        body: '{"msg": "ok"}',
        delayMs: 0,
        status: true,
        responseType: 'JSON',
      });
    });

    expect(deps.createResponseScenario).not.toHaveBeenCalled();
  });

  it('should create new response scenario for JSON responseType', async () => {
    const { result } = renderHook(() => useResponseScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveRespScenario({
        name: '200 OK',
        statusCode: 200,
        priority: 100,
        weight: 100,
        body: '{"msg": "ok"}',
        delayMs: 100,
        status: true,
        responseType: 'JSON',
      });
    });

    expect(deps.createResponseScenario).toHaveBeenCalledWith({
      requestScenarioId: 'req-1',
      name: '200 OK',
      description: '',
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { msg: 'ok' },
      responseType: 'JSON',
      filePath: null,
      fileName: null,
      delayMs: 100,
      weight: 100,
      priority: 100,
      status: true,
    });
    expect(deps.setIsRespModalOpen).toHaveBeenCalledWith(false);
  });

  it('should update response scenario for FILE responseType', async () => {
    deps.editingRespScenarioId = 'res-1';
    const { result } = renderHook(() => useResponseScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveRespScenario({
        name: 'File Resp',
        statusCode: 200,
        priority: 100,
        weight: 100,
        body: '',
        delayMs: 0,
        status: true,
        responseType: 'FILE',
        filePath: '/uploads/file.pdf',
        fileName: 'file.pdf',
      });
    });

    expect(deps.updateResponseScenario).toHaveBeenCalledWith(
      'res-1',
      expect.objectContaining({
        responseType: 'FILE',
        filePath: '/uploads/file.pdf',
        fileName: 'file.pdf',
        headers: {},
        body: {},
      })
    );
  });
});
