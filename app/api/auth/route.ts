import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserSession } from '@/src/domain/auth/entity/user_session';

export const runtime = 'nodejs';

const AUTH_COOKIE = 'mock-api-studio-auth';

function getAuthCredentials() {
  const username = process.env.APP_USERNAME?.trim();
  const password = process.env.APP_PASSWORD?.trim();

  if (!username || !password) {
    throw new Error('APP_USERNAME and APP_PASSWORD must be configured');
  }

  return { username, password };
}

function parseSession(raw: string | undefined): UserSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(AUTH_COOKIE)?.value);
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const { username, password, rememberMe = false } = (await request.json()) as {
    username?: string;
    password?: string;
    rememberMe?: boolean;
  };

  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  let credentials;
  try {
    credentials = getAuthCredentials();
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Authentication configuration is missing',
      },
      { status: 500 }
    );
  }

  if (cleanUsername === credentials.username.toLowerCase() && cleanPassword === credentials.password) {
    const session: UserSession = {
      username: credentials.username,
      name: credentials.username,
      role: 'Administrator',
      token: `mock-jwt-token-${Date.now()}`,
      rememberMe,
      loginAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // Default 1 day or 30 days if rememberMe
    });

    return NextResponse.json({ success: true, session });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Invalid username or password',
    },
    { status: 401 }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
