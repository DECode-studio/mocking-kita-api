import { NextResponse } from 'next/server';
import { accountRepository } from '@/src/modules/account';
import { getServerSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return jsonFail('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const accounts = await accountRepository.getAll();
    return NextResponse.json({
      success: true,
      accounts: accounts.map((a) => ({
        id: a.id,
        username: a.username,
        name: a.name,
        role: a.role,
        googleId: a.googleId,
      })),
    });
  } catch (error) {
    return jsonUnknownError('Accounts fetch failed', error, 'Failed to fetch accounts', 'ACCOUNT_FETCH_FAILED');
  }
}
