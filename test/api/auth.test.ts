import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/src/app/api/auth/route';
import { cookies } from 'next/headers';
import { accountRepository } from '@/src/modules/account';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/modules/account', () => ({
  accountRepository: {
    getByUsername: vi.fn(),
    create: vi.fn(),
    getPasswordHash: vi.fn(),
  },
}));

describe('/api/auth route', () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.APP_USERNAME = 'admin';
    process.env.APP_PASSWORD = 'password123';
    process.env.SSO_DOMAINS = 'example.com';

    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
    };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('GET should return current session from cookie', async () => {
    const sessionData = {
      username: 'admin',
      name: 'Admin',
      role: 'ADMIN',
      token: 'test-token',
      rememberMe: false,
      loginAt: '2026-09-03T00:00:00.000Z',
    };
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(sessionData) });

    const res = await GET();
    const json = await res.json();

    expect(json).toEqual({ session: sessionData });
  });

  it('GET should return null session if cookie is missing or invalid', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    const json = await res.json();

    expect(json).toEqual({ session: null });
  });

  it('POST should return 400 if username is missing', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Username or Email is required');
  });

  it('POST with admin credentials should succeed and set auth cookie', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.session.username).toBe('admin');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'mock-api-studio-auth',
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('POST with non-existent email without registerExtra should return requiresRegistration', async () => {
    (accountRepository.getByUsername as any).mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'user@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requiresRegistration).toBe(true);
    expect(json.email).toBe('user@example.com');
  });

  it('POST with non-whitelisted email domain should return 400', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'user@otherdomain.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Only whitelisted email domains are allowed');
  });

  it('DELETE should clear auth cookie and return success', async () => {
    const res = await DELETE();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'mock-api-studio-auth',
      '',
      expect.objectContaining({ maxAge: 0 })
    );
  });
});
