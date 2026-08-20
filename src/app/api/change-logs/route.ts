import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/src/core/db/sqlite-client';
import { UserSession } from '@/src/domain/auth/entity/user_session';

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

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(description LIKE ? OR operator LIKE ? OR entity_type LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as count FROM tblChangeLog ${whereClause}`;
    const countRow = db.prepare(countQuery).get(...params) as { count: number } | undefined;
    const totalCount = countRow?.count || 0;

    // Get logs with limit and offset
    const query = `
      SELECT * FROM tblChangeLog 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const logs = db.prepare(query).all(...params, limit, offset);

    return NextResponse.json({
      success: true,
      changeLogs: logs,
      totalCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch change logs' },
      { status: 500 }
    );
  }
}
