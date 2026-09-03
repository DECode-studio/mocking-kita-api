// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboard } from '@/src/presentation/views/dashboard/hook/useDashboard';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { DashboardSummary } from '@/src/domain/dashboard/entity/dashboard_summary';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useDashboard', () => {
  const sampleSummary: DashboardSummary = {
    projectCount: 2,
    activeProjectCount: 1,
    environmentCount: 0,
    endpointCount: 2,
    activeEndpointCount: 2,
    requestScenarioCount: 1,
    responseScenarioCount: 1,
    methodCounts: { GET: 1, POST: 1 },
    recentProjects: [
      { id: 'p1', name: 'P1', status: true, createdAt: '', apiCount: 2, environmentCount: 0 },
    ],
    configuredEndpoints: [
      { id: 'a1', projectId: 'p1', name: 'A1', path: '/a1', methodRequest: 'GET', status: true, requestScenarioCount: 1 },
      { id: 'a2', projectId: 'p1', name: 'A2', path: '/a2', methodRequest: 'POST', status: true, requestScenarioCount: 0 },
    ],
  };

  it('should compute active counts and method counts correctly', () => {
    const { result } = renderHook(() => useDashboard(sampleSummary));

    expect(result.current.summary.activeProjectCount).toBe(1);
    expect(result.current.summary.activeEndpointCount).toBe(2);
    expect(result.current.summary.requestScenarioCount).toBe(1);
    expect(result.current.summary.responseScenarioCount).toBe(1);
    expect(result.current.totalApisCount).toBe(sampleSummary.endpointCount);
    expect(result.current.methodCounts).toEqual({ GET: 1, POST: 1 });
  });

  it('should handle goToProjects navigation', () => {
    const { result } = renderHook(() => useDashboard(sampleSummary));

    act(() => {
      result.current.goToProjects();
    });

    expect(mockPush).toHaveBeenCalledWith('/projects');
  });

  it('should handle openImportExport dialog', () => {
    const { result } = renderHook(() => useDashboard(sampleSummary));

    act(() => {
      result.current.openImportExport();
    });

    expect(useUIStore.getState().isImportModalOpen).toBe(true);
  });
});
