// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboard } from '@/src/presentation/views/dashboard/hook/useDashboard';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useDashboard', () => {
  const sampleDb: MockApiDatabase = {
    version: '1.0.0',
    projects: [
      { id: 'p1', name: 'P1', status: true, createdAt: '', updatedAt: '' },
      { id: 'p2', name: 'P2', status: false, createdAt: '', updatedAt: '' },
      { id: 'p3', name: 'P3', status: true, deletedAt: '2026-01-01', createdAt: '', updatedAt: '' },
    ],
    environments: [],
    collections: [],
    apiCollections: [
      { id: 'a1', projectId: 'p1', name: 'A1', path: '/a1', methodRequest: 'GET', status: true, createdAt: '', updatedAt: '' },
      { id: 'a2', projectId: 'p1', name: 'A2', path: '/a2', methodRequest: 'POST', status: true, createdAt: '', updatedAt: '' },
      { id: 'a3', projectId: 'p1', name: 'A3', path: '/a3', methodRequest: 'GET', status: true, deletedAt: '2026-01-01', createdAt: '', updatedAt: '' },
    ],
    apiEnvironments: [],
    requestScenarios: [
      {
        id: 'r1',
        apiId: 'a1',
        name: 'R1',
        matchType: 'EXACT',
        priority: 1,
        headers: {},
        queryParams: {},
        pathParams: {},
        body: {},
        bodyType: 'JSON',
        status: true,
        createdAt: '',
        updatedAt: '',
      },
    ],
    responseScenarios: [
      {
        id: 'res1',
        requestScenarioId: 'r1',
        name: 'Res1',
        statusCode: 200,
        headers: {},
        body: {},
        responseType: 'JSON',
        delayMs: 0,
        weight: 1,
        priority: 1,
        status: true,
        createdAt: '',
        updatedAt: '',
      },
    ],
  };

  it('should compute active counts and method counts correctly', () => {
    const { result } = renderHook(() => useDashboard(sampleDb));

    expect(result.current.activeProjects).toHaveLength(1);
    expect(result.current.activeApis).toHaveLength(2);
    expect(result.current.activeReqs).toHaveLength(1);
    expect(result.current.activeResps).toHaveLength(1);

    expect(result.current.totalApisCount).toBe(2);
    expect(result.current.methodCounts).toEqual({ GET: 1, POST: 1 });
  });

  it('should handle goToProjects navigation', () => {
    const { result } = renderHook(() => useDashboard(sampleDb));

    act(() => {
      result.current.goToProjects();
    });

    expect(mockPush).toHaveBeenCalledWith('/projects');
  });

  it('should handle openImportExport dialog', () => {
    const { result } = renderHook(() => useDashboard(sampleDb));

    act(() => {
      result.current.openImportExport();
    });

    expect(useUIStore.getState().isImportModalOpen).toBe(true);
  });
});
