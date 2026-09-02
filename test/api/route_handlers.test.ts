import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } from '@/src/app/api/route';
import { GET as CATCH_GET } from '@/src/app/api/[...path]/route';
import { handleInternalApiRequest } from '@/src/app/api/internal-proxy';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/src/app/api/internal-proxy', () => ({
  handleInternalApiRequest: vi.fn(),
}));

describe('Root API route and [...path] catch-all handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('HTTP methods in route.ts should delegate to handleInternalApiRequest', async () => {
    (handleInternalApiRequest as any).mockResolvedValue(NextResponse.json({ ok: true }));

    const req = new NextRequest('http://localhost/api');

    await GET(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await POST(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await PUT(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await PATCH(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await DELETE(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await OPTIONS(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);

    await HEAD(req);
    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);
  });

  it('CATCH_GET in [...path]/route.ts should delegate to handleInternalApiRequest', async () => {
    (handleInternalApiRequest as any).mockResolvedValue(NextResponse.json({ ok: true }));

    const req = new NextRequest('http://localhost/api/test/path');
    await CATCH_GET(req);

    expect(handleInternalApiRequest).toHaveBeenCalledWith(req);
  });
});
