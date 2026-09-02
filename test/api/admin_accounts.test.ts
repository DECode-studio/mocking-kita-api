import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/src/app/api/admin/accounts/route';
import { cookies } from 'next/headers';
import { accountRepository } from '@/src/data/account/repository/account_repository_impl';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/src/data/account/repository/account_repository_impl', () => ({
  accountRepository: {
    getAll: vi.fn(),
    getByUsername: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('/api/admin/accounts route', () => {
  let mockCookieStore: any;
  const adminSession = { username: 'admin', role: 'ADMIN' };
  const userSession = { username: 'user1', role: 'USER' };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SSO_DOMAINS = 'example.com';

    mockCookieStore = { get: vi.fn() };
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('GET should return 403 Forbidden for non-admin session', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(userSession) });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });

  it('GET should return accounts for admin session', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });
    (accountRepository.getAll as any).mockResolvedValue([{ id: 'acc-1', username: 'admin' }]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.accounts).toHaveLength(1);
    expect(json.ssoDomains).toEqual(['example.com']);
  });

  it('POST should return 400 when missing required fields', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });

    const req = new Request('http://localhost/api/admin/accounts', {
      method: 'POST',
      body: JSON.stringify({ username: 'newadmin', role: 'ADMIN' }), // missing name and password for admin
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing required fields');
  });

  it('POST should create account for admin user', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });
    (accountRepository.getByUsername as any).mockResolvedValue(null);
    (accountRepository.create as any).mockResolvedValue({ id: 'acc-2', username: 'newadmin', name: 'New Admin', role: 'ADMIN' });

    const req = new Request('http://localhost/api/admin/accounts', {
      method: 'POST',
      body: JSON.stringify({ username: 'newadmin', password: 'password', name: 'New Admin', role: 'ADMIN' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.account.username).toBe('newadmin');
  });

  it('DELETE should return 400 when deleting self or missing ID', async () => {
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(adminSession) });

    const reqMissing = new Request('http://localhost/api/admin/accounts', { method: 'DELETE' });
    const resMissing = await DELETE(reqMissing);
    expect(resMissing.status).toBe(400);

    const reqSelf = new Request('http://localhost/api/admin/accounts?id=admin', { method: 'DELETE' });
    const resSelf = await DELETE(reqSelf);
    const jsonSelf = await resSelf.json();
    expect(resSelf.status).toBe(400);
    expect(jsonSelf.error).toBe('Cannot delete currently logged in account');
  });
});
