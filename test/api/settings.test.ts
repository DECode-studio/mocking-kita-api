import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/src/app/api/settings/route';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('/api/settings route', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = { get: vi.fn(), set: vi.fn() };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('GET should return parsed theme from cookie or default dark', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify({ theme: 'light' }) });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.theme).toBe('light');
  });

  it('PUT should update theme cookie and return updated theme', async () => {
    const req = new Request('http://localhost/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ theme: 'system' }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.theme).toBe('system');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'mock-api-studio-settings',
      JSON.stringify({ theme: 'system' }),
      expect.objectContaining({ path: '/' })
    );
  });
});
