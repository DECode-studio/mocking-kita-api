import { NextResponse } from 'next/server';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { accountRepository } from '@/src/modules/account';
import { verifyPassword, hashPassword } from '@/src/core/utils/password-hash';
import { generateId } from '@/src/core/utils/uuid';
import { hasAdminAuthority } from '@/src/core/constants/roles';
import { ENV } from '@/src/core/constants/env';
import { clearServerSession, getServerSession, setServerSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';
import { checkRateLimit, getRequestRateLimitKey } from '@/src/core/server/security/rate-limit';
import { randomBytes } from 'node:crypto';
import { AuthLoginSchema } from './auth.schema';

function getAuthCredentials() {
  const username = ENV.APP_USERNAME;
  const password = ENV.APP_PASSWORD;

  if (!username || !password) {
    throw new Error('APP_USERNAME and APP_PASSWORD must be configured');
  }

  return { username, password };
}

function getSsoDomains(): string[] {
  return ENV.SSO_DOMAINS;
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

export async function GET() {
  const session = await getServerSession();
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getRequestRateLimitKey(request, 'auth'), 20, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many authentication attempts', code: 'AUTH_RATE_LIMITED' },
      { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds ?? 1) } }
    );
  }

  const parsed = AuthLoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return jsonFail(parsed.error.issues[0]?.message || 'Invalid login request', 400, 'INVALID_LOGIN_REQUEST');
  }

  const { username, password, rememberMe, registerExtra } = parsed.data;

  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanUsername) {
    return jsonFail('Username or Email is required', 400, 'USERNAME_REQUIRED');
  }

  let session: UserSession | null = null;

  // Case A: User logs in using Email (Non-Admin -> SSO login)
  if (cleanUsername.includes('@')) {
    if (!isValidEmail(cleanUsername)) {
      return jsonFail('Invalid email address format', 400, 'INVALID_EMAIL');
    }

    const domain = cleanUsername.split('@')[1];
    const allowedDomains = getSsoDomains();

    if (allowedDomains.length > 0 && (!domain || !allowedDomains.includes(domain))) {
      return jsonFail(`Only whitelisted email domains are allowed to sign in. Whitelisted: ${allowedDomains.join(', ')}`, 400, 'SSO_DOMAIN_NOT_ALLOWED');
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
          return jsonFail('Display Name is required', 400, 'DISPLAY_NAME_REQUIRED');
        }
        if (!role || !role.trim()) {
          return jsonFail('Role is required', 400, 'ROLE_REQUIRED');
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
    } catch (err) {
      return jsonUnknownError('Auth SSO login failed', err, 'Authentication failed', 'AUTH_SSO_FAILED');
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
    } catch {
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
      // Check database if there's any admin or manager accounts
      try {
        const account = await accountRepository.getByUsername(cleanUsername);
        if (account && hasAdminAuthority(account.role)) {
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
      } catch (err) {
        return jsonUnknownError('Auth database login failed', err, 'Authentication failed', 'AUTH_DATABASE_FAILED');
      }
    }
  }

  if (session) {
    await setServerSession(session);

    return NextResponse.json({ success: true, session });
  }

  return jsonFail('Invalid username or password', 401, 'INVALID_CREDENTIALS');
}

export async function DELETE() {
  await clearServerSession();

  return NextResponse.json({ success: true });
}
