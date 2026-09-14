import { cookies } from 'next/headers';
import { UserSession } from '@/src/client/domain/auth/entity/user_session';
import { hasAdminAuthority } from '@/src/core/constants/roles';
import { ENV } from '@/src/core/constants/env';

export const AUTH_COOKIE = 'mock-api-studio-auth';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const REMEMBER_ME_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS * 30;

export function parseServerSession(raw: string | undefined): UserSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<UserSession>;
    if (
      typeof value.username !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.role !== 'string' ||
      typeof value.loginAt !== 'string'
    ) {
      return null;
    }

    return {
      username: value.username,
      name: value.name,
      avatarUrl: typeof value.avatarUrl === 'string' ? value.avatarUrl : undefined,
      role: value.role,
      googleId: typeof value.googleId === 'string' ? value.googleId : (value.googleId ?? null),
      token: typeof value.token === 'string' ? value.token : '',
      rememberMe: Boolean(value.rememberMe),
      loginAt: value.loginAt,
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  return parseServerSession(cookieStore.get(AUTH_COOKIE)?.value);
}

export async function requireAdminSession(): Promise<UserSession | null> {
  const session = await getServerSession();
  return session && hasAdminAuthority(session.role) ? session : null;
}

export async function setServerSession(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.IS_PRODUCTION,
    path: '/',
    maxAge: session.rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearServerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.IS_PRODUCTION,
    path: '/',
    maxAge: 0,
  });
}
