import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUTH_COOKIE = 'mock-api-studio-auth';

export interface UserSession {
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  token: string;
  rememberMe: boolean;
  loginAt: string;
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

  if (cleanUsername === 'admin' && password === 'admin123') {
    const session: UserSession = {
      username: 'admin',
      name: 'System Admin',
      role: 'Administrator',
      token: 'mock-jwt-token-admin-' + Date.now(),
      rememberMe,
      loginAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
    });

    return NextResponse.json({ success: true, session });
  }

  if (password === 'admin123' || password === 'demo123') {
    const session: UserSession = {
      username: cleanUsername,
      name: cleanUsername || 'User',
      role: 'Developer',
      token: 'mock-jwt-token-user-' + Date.now(),
      rememberMe,
      loginAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
    });

    return NextResponse.json({ success: true, session });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Invalid username or password. Demo account: admin / admin123',
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
