import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ENV } from '@/src/core/constants/env';

const UI_ROUTES = [
  '/',
  '/sign-in',
  '/dashboard',
  '/projects',
  '/apis',
  '/environments',
  '/scenario-flows',
  '/settings',
  '/account-settings',
  '/change-logs',
  '/faq',
  '/admin',
  '/external-api-docs',
];

const STUDIO_INTERNAL_API_PREFIXES = [
  '/api/auth',
  '/api/account',
  '/api/accounts',
  '/api/database',
  '/api/settings',
  '/api/admin',
  '/api/upload',
  '/api/projects',
  '/api/scenario-flows',
  '/api/change-logs',
  '/api/faq',
  '/api/v1/external',
];

function getInternalStudioCorsHeaders(request: NextRequest): Record<string, string> {
  const rawAppUrl = ENV.APP_URL || '';
  const allowedOrigins = rawAppUrl
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const reqOrigin = request.headers.get('origin')?.trim().replace(/\/+$/, '');
  let allowedOrigin = allowedOrigins[0] || '*';
  let allowCredentials = true;

  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    allowedOrigin = reqOrigin || '*';
    allowCredentials = !!reqOrigin;
  } else if (reqOrigin && allowedOrigins.some((url) => url.toLowerCase() === reqOrigin.toLowerCase())) {
    allowedOrigin = reqOrigin;
    allowCredentials = true;
  }

  const requestedHeaders = request.headers.get('access-control-request-headers');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': requestedHeaders || 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400',
  };

  if (allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function handleInternalStudioPreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  const corsHeaders = getInternalStudioCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

function applyInternalStudioCors(request: NextRequest, response: NextResponse): NextResponse {
  const corsHeaders = getInternalStudioCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle Internal Studio Management APIs with strict CORS matching APP_URL
  if (STUDIO_INTERNAL_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (request.method === 'OPTIONS') {
      return handleInternalStudioPreflight(request);
    }
    const response = NextResponse.next();
    return applyInternalStudioCors(request, response);
  }

  // Ignore Next.js internals, static assets, Studio UI routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    UI_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return NextResponse.next();
  }

  // If already starting with /api/, Next.js routes it directly to src/app/api/[...path]/route.ts
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rewrite non-/api/ request (e.g. /media/upload-stream -> /api/media/upload-stream)
  const url = request.nextUrl.clone();
  url.pathname = `/api${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
