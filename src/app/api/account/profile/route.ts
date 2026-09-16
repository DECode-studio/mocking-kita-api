import { NextResponse } from 'next/server';
import { accountRepository } from '@/src/server/account';
import { getServerSession, setServerSession } from '@/src/core/server/auth/session';
import { hashPassword, verifyPassword } from '@/src/core/utils/password-hash';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return jsonFail('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const account = await accountRepository.getByUsername(session.username);

    if (account) {
      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          username: account.username,
          name: account.name,
          role: account.role,
          googleId: account.googleId || null,
        },
      });
    }

    // Fallback for session user not stored directly in DB (e.g. ENV admin credentials)
    return NextResponse.json({
      success: true,
      account: {
        id: session.username,
        username: session.username,
        name: session.name,
        role: session.role,
        googleId: session.googleId || null,
      },
    });
  } catch (error) {
    return jsonUnknownError('Profile fetch failed', error, 'Failed to fetch user profile', 'PROFILE_FETCH_FAILED');
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return jsonFail('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { name, currentPassword, newPassword } = body;

    let account = await accountRepository.getByUsername(session.username);

    // If updating name
    let updatedName = session.name;
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return jsonFail('Name cannot be empty', 400, 'INVALID_NAME');
      }
      updatedName = trimmedName;
    }

    // If updating password
    let newPasswordHash: string | undefined = undefined;
    if (newPassword !== undefined && newPassword !== '') {
      const trimmedNewPass = String(newPassword).trim();
      if (trimmedNewPass.length < 6) {
        return jsonFail('New password must be at least 6 characters long', 400, 'PASSWORD_TOO_SHORT');
      }

      if (account) {
        const existingHash = await accountRepository.getPasswordHash(account.id);
        if (existingHash) {
          if (!currentPassword || typeof currentPassword !== 'string') {
            return jsonFail('Current password is required to set a new password', 400, 'CURRENT_PASSWORD_REQUIRED');
          }
          if (!verifyPassword(currentPassword, existingHash)) {
            return jsonFail('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
          }
        }
      }

      newPasswordHash = hashPassword(trimmedNewPass);
    }

    // Perform database update if account exists in database
    if (account) {
      account = await accountRepository.update(account.id, {
        ...(name !== undefined && { name: updatedName }),
        ...(newPasswordHash && { passwordHash: newPasswordHash }),
      });
    }

    // Update server session cookie with new name if changed
    const updatedSession = {
      ...session,
      name: updatedName,
    };
    await setServerSession(updatedSession);

    return NextResponse.json({
      success: true,
      message: 'Account profile updated successfully',
      account: {
        id: account?.id || session.username,
        username: session.username,
        name: updatedName,
        role: session.role,
        googleId: session.googleId || null,
      },
      session: updatedSession,
    });
  } catch (error) {
    return jsonUnknownError('Profile update failed', error, 'Failed to update account profile', 'PROFILE_UPDATE_FAILED');
  }
}
