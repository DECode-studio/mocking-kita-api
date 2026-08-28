import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/src/core/db/prisma-client';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { Prisma } from '@prisma/client';

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

    const where: Prisma.ChangeLogWhereInput = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { operator: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (action) {
      where.action = action;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const [totalCount, logs] = await Promise.all([
      prisma.changeLog.count({ where }),
      prisma.changeLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      project_id: log.projectId,
      user_id: log.userId,
      operator: log.operator,
      description: log.description,
      before_state: log.beforeState ? JSON.stringify(log.beforeState) : null,
      after_state: log.afterState ? JSON.stringify(log.afterState) : null,
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
      created_at: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      changeLogs: formattedLogs,
      totalCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch change logs' },
      { status: 500 }
    );
  }
}
