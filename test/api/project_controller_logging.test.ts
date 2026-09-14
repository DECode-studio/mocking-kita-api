import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/src/server/project/project.controller';
import { createProject } from '@/src/server/project/project.repository';
import { logChange } from '@/src/core/db/change_log_helper';

vi.mock('@/src/server/project/project.repository', () => ({
  createProject: vi.fn(),
  getAllProjects: vi.fn(),
  getProjectById: vi.fn(),
  hardDeleteProject: vi.fn(),
  restoreProject: vi.fn(),
  softDeleteProject: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock('@/src/core/db/change_log_helper', () => ({
  logChange: vi.fn(),
}));

vi.mock('@/src/server/mock-proxy/mock-proxy.cache', () => ({
  clearInternalProxyCache: vi.fn(),
}));

vi.mock('@/src/core/utils/uuid', () => ({
  generateId: () => 'project-1',
}));

describe('project controller logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs direct project creates so Google Space notification can dispatch', async () => {
    vi.mocked(createProject).mockResolvedValue({
      id: 'project-1',
      name: 'Billing API',
      description: undefined,
      status: true,
      createdAt: '2026-09-04T00:00:00.000Z',
      updatedAt: '2026-09-04T00:00:00.000Z',
      deletedAt: null,
    });

    const response = await POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Billing API', status: true }),
      })
    );

    expect(response.status).toBe(200);
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'project',
        entityId: 'project-1',
        projectId: 'project-1',
      })
    );
  });
});
