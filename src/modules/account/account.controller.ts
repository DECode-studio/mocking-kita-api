import { NextResponse } from 'next/server';
import { accountRepository } from './account.repository';
import { hashPassword } from '@/src/core/utils/password-hash';
import { generateId } from '@/src/core/utils/uuid';
import { hasAdminAuthority } from '@/src/core/constants/roles';
import { ENV } from '@/src/core/constants/env';
import { requireAdminSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';
import { randomBytes } from 'node:crypto';
import { AccountCreateSchema, AccountDeleteSchema, AccountUpdateSchema } from './account.schema';

function getSsoDomains(): string[] {
  return ENV.SSO_DOMAINS;
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

export async function GET() {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const accounts = await accountRepository.getAll();
    const ssoDomains = getSsoDomains();
    return NextResponse.json({ success: true, accounts, ssoDomains });
  } catch (error) {
    return jsonUnknownError('Admin accounts fetch failed', error, 'Failed to fetch accounts', 'ACCOUNT_FETCH_FAILED');
  }
}

export async function POST(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const parsed = AccountCreateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonFail('Missing required fields', 400, 'INVALID_ACCOUNT_CREATE_REQUEST');
    }

    const { username, password, name, role } = parsed.data;

    if (!username || !name || !role || (hasAdminAuthority(role) && !password)) {
      return jsonFail('Missing required fields', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const cleanUsername = username.trim().toLowerCase();
    
    // Validate email format and domain for non-admin roles
    const validation = validateNonAdminAccount(cleanUsername, role);
    if (!validation.valid) {
      return jsonFail(validation.error || 'Invalid account data', 400, 'INVALID_ACCOUNT_DATA');
    }

    // Check if account already exists
    const existing = await accountRepository.getByUsername(cleanUsername);
    if (existing) {
      return jsonFail('Username or email already exists', 409, 'ACCOUNT_ALREADY_EXISTS');
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
  } catch (error) {
    return jsonUnknownError('Admin account create failed', error, 'Failed to create account', 'ACCOUNT_CREATE_FAILED');
  }
}

export async function PUT(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const parsed = AccountUpdateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonFail('Missing account ID', 400, 'INVALID_ACCOUNT_UPDATE_REQUEST');
    }

    const { id, username, password, name, role } = parsed.data;

    if (!id) {
      return jsonFail('Missing account ID', 400, 'MISSING_ACCOUNT_ID');
    }

    // Verify account exists
    const existing = await accountRepository.getById(id);
    if (!existing) {
      return jsonFail('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    const targetRole = role !== undefined ? role : existing.role;
    const targetUsername = username !== undefined ? username.trim().toLowerCase() : existing.username;

    // Validate email format and domain for non-admin roles if role or username changes
    if (role !== undefined || username !== undefined) {
      const validation = validateNonAdminAccount(targetUsername, targetRole);
      if (!validation.valid) {
        return jsonFail(validation.error || 'Invalid account data', 400, 'INVALID_ACCOUNT_DATA');
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
          return jsonFail('Username or email already exists', 409, 'ACCOUNT_ALREADY_EXISTS');
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
  } catch (error) {
    return jsonUnknownError('Admin account update failed', error, 'Failed to update account', 'ACCOUNT_UPDATE_FAILED');
  }
}

export async function DELETE(request: Request) {
  const adminSession = await requireAdminSession();
  if (!adminSession) {
    return jsonFail('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      const parsed = AccountDeleteSchema.safeParse(await request.json().catch(() => ({})));
      id = parsed.success ? parsed.data.id : '';
    }

    if (!id) {
      return jsonFail('Missing account ID', 400, 'MISSING_ACCOUNT_ID');
    }

    // Prevent admin from deleting their own database account if they log in through it
    if (id === adminSession.username) {
      return jsonFail('Cannot delete currently logged in account', 400, 'CANNOT_DELETE_CURRENT_ACCOUNT');
    }

    await accountRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonUnknownError('Admin account delete failed', error, 'Failed to delete account', 'ACCOUNT_DELETE_FAILED');
  }
}
