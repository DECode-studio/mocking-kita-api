// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequestScenarioActions } from '@/src/presentation/views/api-detail/hook/useRequestScenarioActions';

describe('useRequestScenarioActions', () => {
  let deps: any;

  beforeEach(() => {
    deps = {
      apiId: 'api-1',
      editingReqScenarioId: null,
      setSelectedReqScenarioId: vi.fn(),
      setIsReqModalOpen: vi.fn(),
      setEditingReqScenario: vi.fn(),
      addToast: vi.fn(),
      createRequestScenario: vi.fn().mockResolvedValue({ id: 'req-2', name: 'New Scenario' }),
      updateRequestScenario: vi.fn().mockResolvedValue({ id: 'req-1', name: 'Updated Scenario' }),
      requestScenarios: [
        {
          id: 'req-1',
          name: 'Existing',
          matchType: 'EXACT',
          bodyType: 'JSON',
          status: true,
          headers: { 'content-type': 'application/json' },
          queryParams: { role: 'admin' },
          pathParams: {},
          body: { active: true },
        },
      ],
    };
  });

  it('should detect duplicate scenario matchmaking and prevent creation', async () => {
    const { result } = renderHook(() => useRequestScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveReqScenario({
        name: 'Duplicate Test',
        priority: 100,
        queryParams: '{"role": "admin"}',
        headers: '{"content-type": "application/json"}',
        body: '{"active": true}',
        bodyType: 'JSON',
        status: true,
      });
    });

    expect(deps.createRequestScenario).not.toHaveBeenCalled();
    expect(deps.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Duplicate Scenario Matchmaking' })
    );
  });

  it('should create a new request scenario when no duplicate exists', async () => {
    const { result } = renderHook(() => useRequestScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveReqScenario({
        name: 'Unique Scenario',
        priority: 100,
        queryParams: '{"role": "user"}',
        headers: '{}',
        body: '{}',
        bodyType: 'JSON',
        status: true,
      });
    });

    expect(deps.createRequestScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Unique Scenario',
        queryParams: { role: 'user' },
      })
    );
    expect(deps.setSelectedReqScenarioId).toHaveBeenCalledWith('req-2');
    expect(deps.setIsReqModalOpen).toHaveBeenCalledWith(false);
  });

  it('should update request scenario when editingReqScenarioId is provided', async () => {
    deps.editingReqScenarioId = 'req-1';
    const { result } = renderHook(() => useRequestScenarioActions(deps));

    await act(async () => {
      await result.current.handleSaveReqScenario({
        name: 'Updated Existing',
        priority: 200,
        queryParams: '{"role": "admin"}',
        headers: '{"content-type": "application/json"}',
        body: '{"active": true}',
        bodyType: 'JSON',
        status: true,
      });
    });

    expect(deps.updateRequestScenario).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({ name: 'Updated Existing', priority: 200 })
    );
  });
});
