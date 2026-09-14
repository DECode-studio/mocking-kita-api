import { NextResponse } from 'next/server';
import { getServerSession } from '@/src/core/server/auth/session';
import { jsonFail, jsonUnknownError } from '@/src/core/server/http/responses';
import { getChangeLogs } from './change-log.service';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return jsonFail('Unauthorized', 401, 'UNAUTHORIZED');
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
  } catch (error) {
    return jsonUnknownError('Failed to fetch change logs', error, 'Failed to fetch change logs', 'CHANGE_LOG_FETCH_FAILED');
  }
}
