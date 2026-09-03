import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { getChangeLogs } from './change-log.service';

export const runtime = 'nodejs';

async function verifySession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get('mock-api-studio-auth')?.value;
    if (!rawSession) return null;
    return JSON.parse(rawSession) as UserSession;
  } catch {}
  return null;
}

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const action = searchParams.get('action')?.trim() || '';
    const projectId = searchParams.get('projectId')?.trim() || '';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const { changeLogs, totalCount } = await getChangeLogs({ search, action, projectId, limit, offset });

    return NextResponse.json({
      success: true,
      changeLogs,
      totalCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch change logs' },
      { status: 500 }
    );
  }
}
