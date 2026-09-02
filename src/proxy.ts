import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const UI_ROUTES = [
  '/',
  '/sign-in',
  '/dashboard',
  '/projects',
  '/apis',
  '/environments',
  '/settings',
  '/change-logs',
  '/faq',
  '/admin',
];

const STUDIO_INTERNAL_API_PREFIXES = [
  '/api/auth',
  '/api/database',
  '/api/settings',
  '/api/admin',
  '/api/upload',
  '/api/projects',
  '/api/change-logs',
  '/api/faq',
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next.js internals, static assets, Studio UI routes, and internal Studio APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    UI_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    STUDIO_INTERNAL_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
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
