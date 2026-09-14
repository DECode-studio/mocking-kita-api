// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequestScenarioModal } from '@/src/client/presentation/views/api-detail/hook/useRequestScenarioModal';

describe('useRequestScenarioModal', () => {
  it('should initialize empty values when not editing', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useRequestScenarioModal({ isOpen: true, editingReqScenario: null, onSubmit })
    );

    expect(result.current.name).toBe('');
    expect(result.current.priority).toBe(1);
    expect(result.current.bodyType).toBe('JSON');
  });

  it('should initialize values from editingReqScenario', () => {
    const onSubmit = vi.fn();
    const scenario = {
      id: 'req-1',
      name: 'Admin Request',
      priority: 5,
      queryParams: { page: '1' },
      headers: { Auth: 'Token' },
      body: { data: 'test' },
      bodyType: 'JSON',
      status: false,
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioModal({ isOpen: true, editingReqScenario: scenario, onSubmit })
    );

    expect(result.current.name).toBe('Admin Request');
    expect(result.current.priority).toBe(5);
    expect(JSON.parse(result.current.queryParams)).toEqual({ page: '1' });
    expect(result.current.status).toBe(false);
  });

  it('should invoke onSubmit with structured values on handleSubmit', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useRequestScenarioModal({ isOpen: true, editingReqScenario: null, onSubmit })
    );

    act(() => {
      result.current.setName('My Scenario');
      result.current.setPriority(10);
    });

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleSubmit({ preventDefault } as any);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Scenario',
      priority: 10,
      matchStrategy: 'ALL',
      queryParams: '{}',
      headers: '{}',
      body: '{}',
      bodyType: 'JSON',
      bodyRules: [],
      status: true,
    });
  });

  it('should initialize and submit bodyRules', () => {
    const onSubmit = vi.fn();
    const scenario = {
      id: 'req-2',
      name: 'Scenario with Rules',
      priority: 1,
      queryParams: {},
      headers: {},
      body: {},
      bodyType: 'JSON',
      bodyRules: [{ path: 'user.id', operator: 'equal', value: '123', enabled: true }],
      status: true,
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioModal({ isOpen: true, editingReqScenario: scenario, onSubmit })
    );

    expect(result.current.bodyRules).toEqual([
      { path: 'user.id', operator: 'equal', value: '123', enabled: true },
    ]);

    act(() => {
      result.current.setBodyRules([
        { path: 'user.id', operator: 'equal', value: '123', enabled: true },
        { path: 'user.role', operator: 'equal', value: 'admin', enabled: true },
      ]);
    });

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleSubmit({ preventDefault } as any);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyRules: [
          { path: 'user.id', operator: 'equal', value: '123', enabled: true },
          { path: 'user.role', operator: 'equal', value: 'admin', enabled: true },
        ],
      })
    );
  });
});
