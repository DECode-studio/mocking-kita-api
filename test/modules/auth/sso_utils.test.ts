import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRedirectUri, sanitizeUrl } from '@/src/modules/auth/sso-utils';

describe('sso-utils', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.GOOGLE_CALLBACK_ROUTE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('sanitizeUrl', () => {
    it('should clean up duplicate domain prefixes', () => {
      const duplicated = 'https://mocking.kbfinansia.comhttps://mocking.kbfinansia.com/api/auth/sso/callback';
      expect(sanitizeUrl(duplicated)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });

    it('should leave normal URLs untouched', () => {
      const normal = 'https://mocking.kbfinansia.com/api/auth/sso/callback';
      expect(sanitizeUrl(normal)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });
  });

  describe('getRedirectUri', () => {
    it('should return full URL directly if GOOGLE_CALLBACK_ROUTE is a full URL', () => {
      process.env.APP_URL = 'https://mocking.kbfinansia.com';
      process.env.GOOGLE_CALLBACK_ROUTE = 'https://mocking.kbfinansia.com/api/auth/sso/callback';

      const req = new Request('https://mocking.kbfinansia.com/api/auth/sso');
      expect(getRedirectUri(req)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });

    it('should fix duplicate domains if GOOGLE_CALLBACK_ROUTE or APP_URL has duplicated domains', () => {
      process.env.APP_URL = 'https://mocking.kbfinansia.com';
      process.env.GOOGLE_CALLBACK_ROUTE = 'https://mocking.kbfinansia.comhttps://mocking.kbfinansia.com/api/auth/sso/callback';

      const req = new Request('https://mocking.kbfinansia.com/api/auth/sso');
      expect(getRedirectUri(req)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });

    it('should concatenate APP_URL and relative GOOGLE_CALLBACK_ROUTE correctly', () => {
      process.env.APP_URL = 'https://mocking.kbfinansia.com';
      process.env.GOOGLE_CALLBACK_ROUTE = '/api/auth/sso/callback';

      const req = new Request('https://mocking.kbfinansia.com/api/auth/sso');
      expect(getRedirectUri(req)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });

    it('should handle APP_URL with trailing slashes or path', () => {
      process.env.APP_URL = 'https://mocking.kbfinansia.com/';
      process.env.GOOGLE_CALLBACK_ROUTE = 'api/auth/sso/callback';

      const req = new Request('https://mocking.kbfinansia.com/api/auth/sso');
      expect(getRedirectUri(req)).toBe('https://mocking.kbfinansia.com/api/auth/sso/callback');
    });

    it('should fallback to request.url when APP_URL is not set', () => {
      process.env.GOOGLE_CALLBACK_ROUTE = '/api/auth/sso/callback';

      const req = new Request('http://0.0.0.0:3000/api/auth/sso');
      expect(getRedirectUri(req)).toBe('http://localhost:3000/api/auth/sso/callback');
    });
  });
});
