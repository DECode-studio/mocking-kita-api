import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { accountRepository } from './account.repository';
import { hashPassword } from '@/src/core/utils/password-hash';
import { generateId } from '@/src/core/utils/uuid';
import { hasAdminAuthority } from '@/src/core/constants/roles';
import { randomBytes } from 'node:crypto';

export const runtime = 'nodejs';

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

function validateNonAdminAccount(username: string, role: string): { valid: boolean; error?: string } {
  if (hasAdminAuthority(role)) {
    return { valid: true };
  }

  if (!isValidEmail(username)) {
    return { valid: false, error: 'Non-admin accounts must use a valid email address' };
  }

  const domain = username.split('@')[1]?.toLowerCase();
  const allowedDomains = getSsoDomains();

  if (allowedDomains.length > 0 && (!domain || !allowedDomains.includes(domain))) {
    return { 
      valid: false, 
      error: `Email domain is not whitelisted. Allowed domains: ${allowedDomains.join(', ')}` 
    };
  }

  return { valid: true };
}

async function verifyAdminSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get('mock-api-studio-auth')?.value;
  if (!rawSession) return null;
  try {
    const session = JSON.parse(rawSession) as UserSession;
    if (hasAdminAuthority(session.role)) {
      return session;
    }
  } catch {}
  return null;
}

export async function GET() {
  const adminSession = await verifyAdminSession();
  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const accounts = await accountRepository.getAll();
    const ssoDomains = getSsoDomains();
    return NextResponse.json({ success: true, accounts, ssoDomains });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminSession = await verifyAdminSession();
  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { username, password, name, role } = (await request.json()) as {
      username?: string;
      password?: string;
      name?: string;
      role?: string;
    };

    if (!username || !name || !role || (hasAdminAuthority(role) && !password)) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    
    // Validate email format and domain for non-admin roles
    const validation = validateNonAdminAccount(cleanUsername, role);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Check if account already exists
    const existing = await accountRepository.getByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username or email already exists' }, { status: 400 });
    }

    // Generate random secure password for non-admins since they log in via SSO
    const finalPassword = !hasAdminAuthority(role) && !password 
      ? randomBytes(32).toString('hex')
      : (password || '');

    const passwordHash = hashPassword(finalPassword);
    const id = generateId();

    const newAccount = await accountRepository.create({
      id,
      username: cleanUsername,
      passwordHash,
      name: name.trim(),
      role,
    });

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create account' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const adminSession = await verifyAdminSession();
  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id, username, password, name, role } = (await request.json()) as {
      id?: string;
      username?: string;
      password?: string;
      name?: string;
      role?: string;
    };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing account ID' }, { status: 400 });
    }

    // Verify account exists
    const existing = await accountRepository.getById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    const targetRole = role !== undefined ? role : existing.role;
    const targetUsername = username !== undefined ? username.trim().toLowerCase() : existing.username;

    // Validate email format and domain for non-admin roles if role or username changes
    if (role !== undefined || username !== undefined) {
      const validation = validateNonAdminAccount(targetUsername, targetRole);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    const params: {
      username?: string;
      passwordHash?: string;
      name?: string;
      role?: string;
    } = {};

    if (username !== undefined) {
      if (targetUsername !== existing.username) {
        const duplicate = await accountRepository.getByUsername(targetUsername);
        if (duplicate) {
          return NextResponse.json({ success: false, error: 'Username or email already exists' }, { status: 400 });
        }
      }
      params.username = targetUsername;
    }

    if (password !== undefined && password !== '') {
      params.passwordHash = hashPassword(password);
    }

    if (name !== undefined) {
      params.name = name.trim();
    }

    if (role !== undefined) {
      params.role = role;
    }

    const updatedAccount = await accountRepository.update(id, params);
    return NextResponse.json({ success: true, account: updatedAccount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminSession = await verifyAdminSession();
  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing account ID' }, { status: 400 });
    }

    // Prevent admin from deleting their own database account if they log in through it
    if (id === adminSession.username) {
      return NextResponse.json({ success: false, error: 'Cannot delete currently logged in account' }, { status: 400 });
    }

    await accountRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete account' }, { status: 500 });
  }
}
