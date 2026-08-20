import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { accountRepository } from '@/src/data/account/repository/account_repository_impl';
import { verifyPassword, hashPassword } from '@/src/core/utils/password-hash';
import { generateId } from '@/src/core/utils/uuid';
import { randomBytes } from 'node:crypto';

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

function getSsoDomains(): string[] {
  const domainsStr = process.env.SSO_DOMAINS || '';
  return domainsStr
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function beautifyEmailName(email: string): string {
  const prefix = email.split('@')[0] || '';
  return prefix
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  const { username, password, rememberMe = false, registerExtra } = (await request.json()) as {
    username?: string;
    password?: string;
    rememberMe?: boolean;
    registerExtra?: { name: string; role: string };
  };

  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanUsername) {
    return NextResponse.json({ success: false, error: 'Username or Email is required' }, { status: 400 });
  }

  let session: UserSession | null = null;

  // Case A: User logs in using Email (Non-Admin -> SSO login)
  if (cleanUsername.includes('@')) {
    if (!isValidEmail(cleanUsername)) {
      return NextResponse.json({ success: false, error: 'Invalid email address format' }, { status: 400 });
    }

    const domain = cleanUsername.split('@')[1];
    const allowedDomains = getSsoDomains();

    if (allowedDomains.length > 0 && (!domain || !allowedDomains.includes(domain))) {
      return NextResponse.json({
        success: false,
        error: `Only whitelisted email domains are allowed to sign in. Whitelisted: ${allowedDomains.join(', ')}`
      }, { status: 400 });
    }

    try {
      // Check if account already exists
      let account = await accountRepository.getByUsername(cleanUsername);

      if (!account) {
        if (!registerExtra) {
          // If no registration data is provided, return that registration is required
          return NextResponse.json({
            success: true,
            requiresRegistration: true,
            email: cleanUsername,
          });
        }

        const { name, role } = registerExtra;
        if (!name || !name.trim()) {
          return NextResponse.json({ success: false, error: 'Display Name is required' }, { status: 400 });
        }
        if (!role || !role.trim()) {
          return NextResponse.json({ success: false, error: 'Role is required' }, { status: 400 });
        }

        // Auto-create account for new SSO user (using user-provided name & role)
        const id = generateId();
        const randomPassword = randomBytes(32).toString('hex');
        const passwordHash = hashPassword(randomPassword);

        account = await accountRepository.create({
          id,
          username: cleanUsername,
          passwordHash,
          name: name.trim(),
          role: role.trim(),
        });
      }

      session = {
        username: account.username,
        name: account.name,
        role: account.role,
        token: `mock-jwt-token-${Date.now()}`,
        rememberMe,
        loginAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err?.message || 'Database error during SSO' }, { status: 500 });
    }
  } 
  // Case B: User logs in using Username (Admin -> Password login)
  else {
    let isEnvAuthenticated = false;
    let adminUsername = '';
    try {
      const credentials = getAuthCredentials();
      if (cleanUsername === credentials.username.toLowerCase() && cleanPassword === credentials.password) {
        isEnvAuthenticated = true;
        adminUsername = credentials.username;
      }
    } catch (error: any) {
      // Environment credentials not configured, fallback to database check
    }

    if (isEnvAuthenticated) {
      session = {
        username: adminUsername,
        name: adminUsername,
        role: 'Administrator',
        token: `mock-jwt-token-${Date.now()}`,
        rememberMe,
        loginAt: new Date().toISOString(),
      };
    } else {
      // Check database if there's any old administrator accounts
      try {
        const account = await accountRepository.getByUsername(cleanUsername);
        if (account && account.role === 'Administrator') {
          const hash = await accountRepository.getPasswordHash(account.id);
          if (hash && verifyPassword(cleanPassword, hash)) {
            session = {
              username: account.username,
              name: account.name,
              role: account.role,
              token: `mock-jwt-token-${Date.now()}`,
              rememberMe,
              loginAt: new Date().toISOString(),
            };
          }
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || 'Database error' }, { status: 500 });
      }
    }
  }

  if (session) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    });

    return NextResponse.json({ success: true, session });
  }

  return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
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


