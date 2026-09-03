import { describe, expect, it, beforeEach } from 'vitest';
import { checkRateLimit, clearRateLimitState, getRequestRateLimitKey } from '@/src/core/server/security/rate-limit';

describe('rate-limit helper', () => {
  beforeEach(() => {
    clearRateLimitState();
  });

  it('blocks requests after the configured limit until the window resets', () => {
    expect(checkRateLimit('auth:1', 2, 1000, 1000).allowed).toBe(true);
    expect(checkRateLimit('auth:1', 2, 1000, 1001).allowed).toBe(true);

    const blocked = checkRateLimit('auth:1', 2, 1000, 1002);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);

    expect(checkRateLimit('auth:1', 2, 1000, 2000).allowed).toBe(true);
  });

  it('builds request keys from forwarded IP headers when present', () => {
    const request = new Request('http://localhost/api/auth', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });

    expect(getRequestRateLimitKey(request, 'auth')).toBe('auth:203.0.113.10');
  });
});
