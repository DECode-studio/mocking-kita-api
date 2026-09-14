import { ENV } from '@/src/core/constants/env';

/**
 * Sanitizes URLs to prevent duplicate scheme/domain patterns.
 * E.g., "https://mocking.kbfinansia.comhttps://mocking.kbfinansia.com/api/auth/sso/callback"
 * becomes "https://mocking.kbfinansia.com/api/auth/sso/callback".
 */
export function sanitizeUrl(urlStr: string): string {
  if (!urlStr) return '';
  const parts = urlStr.trim().split(/(?=https?:\/\/)/i).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : urlStr.trim();
}

/**
 * Computes the absolute redirect URI for Google OAuth SSO.
 * Handles full URLs in GOOGLE_CALLBACK_ROUTE, relative paths, custom APP_URL,
 * duplicate domain concatenation, and request host fallbacks.
 */
export function getRedirectUri(request: Request): string {
  const rawRoute = (ENV.GOOGLE_CALLBACK_ROUTE || '/api/auth/sso/callback').trim();
  const route = sanitizeUrl(rawRoute);

  // If GOOGLE_CALLBACK_ROUTE is already a full URL (http:// or https://)
  if (/^https?:\/\//i.test(route)) {
    return route;
  }

  const formattedRoute = route.startsWith('/') ? route : `/${route}`;

  let origin = '';
  if (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const rawAppUrl = sanitizeUrl(ENV.APP_URL);
      const appUrlWithScheme = /^https?:\/\//i.test(rawAppUrl) ? rawAppUrl : `http://${rawAppUrl}`;
      origin = new URL(appUrlWithScheme).origin;
    } catch {
      origin = sanitizeUrl(ENV.APP_URL).replace(/\/$/, '');
    }
  } else {
    const requestUrl = new URL(request.url);
    let host = requestUrl.host;
    if (host.includes('0.0.0.0')) {
      host = host.replace('0.0.0.0', 'localhost');
    }
    origin = `${requestUrl.protocol}//${host}`;
  }

  return sanitizeUrl(`${origin}${formattedRoute}`);
}
