import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as SSO_GET } from '@/src/app/api/auth/sso/route';
import { GET as CALLBACK_GET } from '@/src/app/api/auth/sso/callback/route';
import { cookies } from 'next/headers';
import { accountRepository } from '@/src/server/account';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/server/account', () => ({
  accountRepository: {
    getByUsername: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue('<html>Mock Template {{email}}</html>'),
  },
}));

describe('/api/auth/sso & callback routes', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    mockCookieStore = { get: vi.fn(), set: vi.fn() };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('SSO_GET should return 501 if Google OAuth is unconfigured', async () => {
    const req = new Request('http://localhost/api/auth/sso');
    const res = await SSO_GET(req);

    expect(res.status).toBe(501);
    const text = await res.text();
    expect(text).toContain('Google Workspace SSO is not configured');
  });

  it('SSO_GET should redirect to Google Auth URL when configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';

    const req = new Request('http://localhost/api/auth/sso');
    const res = await SSO_GET(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get('location')).toContain('accounts.google.com');
  });

  it('CALLBACK_GET should return 400 for invalid request parameters', async () => {
    const req = new Request('http://localhost/api/auth/sso/callback');
    const res = await CALLBACK_GET(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid request parameters');
  });

  it('CALLBACK_GET with success=true should return HTML close script', async () => {
    const req = new Request('http://localhost/api/auth/sso/callback?success=true');
    const res = await CALLBACK_GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
