import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/src/app/api/change-logs/route';
import { cookies } from 'next/headers';
import prisma from '@/src/core/db/prisma-client';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    changeLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('/api/change-logs route', () => {
  let mockCookieStore: any;
  const session = {
    username: 'user1',
    name: 'User 1',
    role: 'USER',
    token: 'test-token',
    rememberMe: false,
    loginAt: '2026-09-03T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = { get: vi.fn() };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('GET should return 401 Unauthorized when session is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const req = new Request('http://localhost/api/change-logs');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('GET should return change logs and totalCount when session exists', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

    const now = new Date();
    const mockLog = {
      id: 'log-1',
      action: 'CREATE',
      entityType: 'project',
      entityId: 'p1',
      projectId: 'p1',
      userId: 'u1',
      operator: 'User 1',
      description: 'Created project',
      beforeState: null,
      afterState: null,
      metadata: null,
      createdAt: now,
    };

    (prisma.changeLog.count as any).mockResolvedValue(1);
    (prisma.changeLog.findMany as any).mockResolvedValue([mockLog]);

    const req = new Request('http://localhost/api/change-logs?limit=10&offset=0&search=project');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.totalCount).toBe(1);
    expect(json.changeLogs[0].id).toBe('log-1');
  });
});
