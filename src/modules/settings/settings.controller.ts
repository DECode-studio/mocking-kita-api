import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ThemeMode } from '@/src/core/theme/theme-types';

export const runtime = 'nodejs';

const SETTINGS_COOKIE = 'mock-api-studio-settings';

function parseTheme(raw: string | undefined): ThemeMode {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  if (!raw) return 'dark';
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.theme === 'light' || parsed?.theme === 'dark' || parsed?.theme === 'system') {
      return parsed.theme;
    }
  } catch {}
  return 'dark';
}

export async function GET() {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(SETTINGS_COOKIE)?.value);
  return NextResponse.json({ theme });
}

export async function PUT(request: Request) {
  const { theme } = (await request.json()) as { theme?: ThemeMode };
  const normalized: ThemeMode = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'dark';

  const cookieStore = await cookies();
  cookieStore.set(SETTINGS_COOKIE, JSON.stringify({ theme: normalized }), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ theme: normalized });
}
