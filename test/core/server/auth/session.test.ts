import { describe, expect, it } from 'vitest';
import { parseServerSession } from '@/src/core/server/auth/session';

describe('parseServerSession', () => {
  it('returns a normalized session for a valid auth cookie', () => {
    const session = parseServerSession(
      JSON.stringify({
        username: 'admin',
        name: 'Admin',
        role: 'ADMIN',
        token: 'token-1',
        rememberMe: true,
        loginAt: '2026-09-03T00:00:00.000Z',
      })
    );

    expect(session).toEqual({
      username: 'admin',
      name: 'Admin',
      avatarUrl: undefined,
      role: 'ADMIN',
      googleId: null,
      token: 'token-1',
      rememberMe: true,
      loginAt: '2026-09-03T00:00:00.000Z',
    });
  });

  it('rejects malformed or incomplete cookie payloads', () => {
    expect(parseServerSession(undefined)).toBeNull();
    expect(parseServerSession('not-json')).toBeNull();
    expect(parseServerSession(JSON.stringify({ role: 'ADMIN' }))).toBeNull();
  });
});
