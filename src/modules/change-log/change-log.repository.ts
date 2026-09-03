import prisma from '@/src/core/db/prisma-client';
import { Prisma } from '@prisma/client';

export type ChangeLogListQuery = {
  search?: string;
  action?: string;
  projectId?: string;
  limit: number;
  offset: number;
};

export type ChangeLogDto = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  project_id: string | null;
  user_id: string | null;
  operator: string | null;
  description: string;
  before_state: string | null;
  after_state: string | null;
  metadata: string | null;
  created_at: string;
};

function buildWhere(query: ChangeLogListQuery): Prisma.ChangeLogWhereInput {
  const where: Prisma.ChangeLogWhereInput = {};

  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { operator: { contains: query.search, mode: 'insensitive' } },
      { entityType: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.action) {
    where.action = query.action;
  }

  if (query.projectId) {
    where.projectId = query.projectId;
  }

  return where;
}

export function toChangeLogDto(log: {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  projectId: string | null;
  userId: string | null;
  operator: string | null;
  description: string;
  beforeState: unknown;
  afterState: unknown;
  metadata: unknown;
  createdAt: Date;
}): ChangeLogDto {
  return {
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
  };
}

export async function listChangeLogs(query: ChangeLogListQuery): Promise<{ changeLogs: ChangeLogDto[]; totalCount: number }> {
  const where = buildWhere(query);
  const [totalCount, logs] = await Promise.all([
    prisma.changeLog.count({ where }),
    prisma.changeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
  ]);

  return {
    changeLogs: logs.map(toChangeLogDto),
    totalCount,
  };
}
