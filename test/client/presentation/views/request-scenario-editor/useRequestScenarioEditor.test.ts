// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequestScenarioEditor } from '@/src/client/presentation/views/request-scenario-editor/hook/useRequestScenarioEditor';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockAddToast = vi.fn();
vi.mock('@/src/client/presentation/stores/uiStore', () => ({
  useUIStore: () => ({
    addToast: mockAddToast,
  }),
}));

describe('useRequestScenarioEditor', () => {
  const projectId = 'proj-1';
  const apiId = 'api-1';

  const mockUseCase = {
    load: vi.fn(),
    createRequestScenario: vi.fn(),
    updateRequestScenario: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values in create mode', () => {
    const initialDetail = {
      project: { id: projectId, name: 'Sample Project' },
      api: { id: apiId, name: 'Sample API', methodRequest: 'POST', path: '/test' },
      requestScenarios: [
        { id: 'req-1', priority: 5, name: 'Scenario 1', status: true },
      ],
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: null,
        initialDetail,
        useCase: mockUseCase,
      })
    );

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.name).toBe('');
    expect(result.current.priority).toBe(6); // max priority (5) + 1
    expect(result.current.status).toBe(true);
    expect(result.current.matchStrategy).toBe('ALL');
    expect(result.current.bodyType).toBe('JSON');
    expect(result.current.bodyRules).toEqual([]);
  });

  it('should initialize with target scenario values in edit mode', () => {
    const initialDetail = {
      project: { id: projectId, name: 'Sample Project' },
      api: { id: apiId, name: 'Sample API', methodRequest: 'POST', path: '/test' },
      requestScenarios: [
        {
          id: 'req-target',
          name: 'Target Scenario',
          priority: 3,
          status: true,
          matchStrategy: 'ANY',
          queryParams: { role: 'admin' },
          headers: { 'X-Auth': 'Token' },
          body: { debitur: [{ id_number: '123' }] },
          bodyType: 'JSON',
          bodyRules: [
            { path: 'debitur.0.id_number', operator: 'equal', value: '123', enabled: true },
          ],
        },
      ],
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: 'req-target',
        initialDetail,
        useCase: mockUseCase,
      })
    );

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.name).toBe('Target Scenario');
    expect(result.current.priority).toBe(3);
    expect(result.current.matchStrategy).toBe('ANY');
    expect(result.current.bodyRules).toHaveLength(1);
    expect(result.current.bodyRules[0].path).toBe('debitur.0.id_number');
  });

  it('should submit create scenario and redirect to API detail page', async () => {
    const initialDetail = {
      project: { id: projectId },
      api: { id: apiId },
      requestScenarios: [],
    } as any;

    mockUseCase.createRequestScenario.mockResolvedValue({ id: 'req-new', name: 'New Scenario' });

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: null,
        initialDetail,
        useCase: mockUseCase,
      })
    );

    act(() => {
      result.current.setName('My New Scenario');
      result.current.setPriority(10);
      result.current.setBodyRules([
        { path: 'user.id', operator: 'equal', value: '99', enabled: true },
        { path: '   ', operator: 'equal', value: '', enabled: true }, // Empty path should be filtered
      ]);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUseCase.createRequestScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        apiId,
        name: 'My New Scenario',
        priority: 10,
        bodyRules: [{ path: 'user.id', operator: 'equal', value: '99', enabled: true }],
      })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    );
    expect(mockPush).toHaveBeenCalledWith(`/projects/${projectId}/apis/${apiId}`);
  });

  it('should submit update scenario and redirect on edit mode', async () => {
    const initialDetail = {
      project: { id: projectId },
      api: { id: apiId },
      requestScenarios: [
        { id: 'req-1', name: 'Old Name', priority: 1, status: true },
      ],
    } as any;

    mockUseCase.updateRequestScenario.mockResolvedValue({ id: 'req-1', name: 'Updated Name' });

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: 'req-1',
        initialDetail,
        useCase: mockUseCase,
      })
    );

    act(() => {
      result.current.setName('Updated Name');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUseCase.updateRequestScenario).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({
        name: 'Updated Name',
      })
    );
    expect(mockPush).toHaveBeenCalledWith(`/projects/${projectId}/apis/${apiId}`);
  });

  it('should validate required name on submit', async () => {
    const initialDetail = {
      project: { id: projectId },
      api: { id: apiId },
      requestScenarios: [],
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: null,
        initialDetail,
        useCase: mockUseCase,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUseCase.createRequestScenario).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', title: 'Validation Error' })
    );
  });

  it('should navigate back on handleCancel', () => {
    const initialDetail = {
      project: { id: projectId },
      api: { id: apiId },
      requestScenarios: [],
    } as any;

    const { result } = renderHook(() =>
      useRequestScenarioEditor({
        projectId,
        apiId,
        scenarioId: null,
        initialDetail,
        useCase: mockUseCase,
      })
    );

    act(() => {
      result.current.handleCancel();
    });

    expect(mockPush).toHaveBeenCalledWith(`/projects/${projectId}/apis/${apiId}`);
  });
});

