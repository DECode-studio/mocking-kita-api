import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/src/app/api/auth/route';
import { cookies } from 'next/headers';
import { accountRepository } from '@/src/server/account';
import { hashPassword } from '@/src/core/utils/password-hash';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/server/account', () => ({
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
      googleId: null,
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

  it('POST with non-admin email and valid password should succeed', async () => {
    const password = 'userSecret123!';
    const passwordHash = hashPassword(password);
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-1',
      username: 'dev@example.com',
      name: 'Developer One',
      role: 'Backend Developer',
      googleId: null,
    });
    (accountRepository.getPasswordHash as any).mockResolvedValue(passwordHash);

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'dev@example.com', password }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.session.username).toBe('dev@example.com');
    expect(json.session.role).toBe('Backend Developer');
    expect(json.session.googleId).toBeNull();
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it('POST with non-admin email and invalid password should return 401', async () => {
    const passwordHash = hashPassword('correctPassword');
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-1',
      username: 'dev@example.com',
      name: 'Developer One',
      role: 'Backend Developer',
    });
    (accountRepository.getPasswordHash as any).mockResolvedValue(passwordHash);

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'dev@example.com', password: 'wrongPassword' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST with existing non-admin email without password should return 400', async () => {
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-1',
      username: 'dev@example.com',
      name: 'Developer One',
      role: 'Backend Developer',
    });

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'dev@example.com', password: '' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('PASSWORD_REQUIRED');
  });

  it('POST with database username without @ and valid password should succeed', async () => {
    const password = 'customPass123!';
    const passwordHash = hashPassword(password);
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-2',
      username: 'regularuser',
      name: 'Regular User',
      role: 'Quality Assurance',
      googleId: null,
    });
    (accountRepository.getPasswordHash as any).mockResolvedValue(passwordHash);

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'regularuser', password }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.session.username).toBe('regularuser');
    expect(json.session.role).toBe('Quality Assurance');
  });

  it('GET should retain session for non-admin password account without googleId', async () => {
    const sessionData = {
      username: 'user@example.com',
      name: 'User',
      role: 'DEVELOPER',
      googleId: null,
      token: 'test-token',
      rememberMe: false,
      loginAt: '2026-09-03T00:00:00.000Z',
    };
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(sessionData) });
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-1',
      username: 'user@example.com',
      role: 'DEVELOPER',
      googleId: null,
    });

    const res = await GET();
    const json = await res.json();

    expect(json.session).not.toBeNull();
    expect(json.session.username).toBe('user@example.com');
    expect(json.session.googleId).toBeNull();
  });

  it('GET should return session if DB account has googleId', async () => {
    const sessionData = {
      username: 'user@example.com',
      name: 'User',
      role: 'DEVELOPER',
      googleId: '1092837465',
      token: 'test-token',
      rememberMe: false,
      loginAt: '2026-09-03T00:00:00.000Z',
    };
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(sessionData) });
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'user-1',
      username: 'user@example.com',
      googleId: '1092837465',
    });

    const res = await GET();
    const json = await res.json();

    expect(json.session).toEqual(expect.objectContaining({
      username: 'user@example.com',
      googleId: '1092837465',
    }));
  });

  it('GET should retain session for admin password account without googleId', async () => {
    const sessionData = {
      username: 'tormentor.the.conqueror',
      name: 'Tormentor',
      role: 'Administrator',
      token: 'test-token',
      rememberMe: false,
      loginAt: '2026-09-03T00:00:00.000Z',
    };
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(sessionData) });
    (accountRepository.getByUsername as any).mockResolvedValue({
      id: 'admin-1',
      username: 'tormentor.the.conqueror',
      role: 'Administrator',
      googleId: null, // Admin accounts don't need googleId
    });

    const res = await GET();
    const json = await res.json();

    expect(json.session).not.toBeNull();
    expect(json.session.username).toBe('tormentor.the.conqueror');
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

