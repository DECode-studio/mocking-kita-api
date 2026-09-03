import prisma from '@/src/core/db/prisma-client';
import { generateId } from '@/src/core/utils/uuid';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { sendGoogleSpaceNotification } from '@/src/core/notification/google_space_notifier';
import { getServerSession } from '@/src/core/server/auth/session';

export type ChangeLogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'RESET';
export type ChangeLogEntityType =
  | 'project'
  | 'collection'
  | 'api'
  | 'request_scenario'
  | 'response_scenario'
  | 'database'
  | 'environment';

export interface ChangeLogInput {
  action: ChangeLogAction;
  entityType: ChangeLogEntityType;
  entityId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  operator?: string | null;
  description?: string | null;
  beforeState?: any;
  afterState?: any;
  metadata?: any;
}

export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    return await getServerSession();
  } catch {
    return null;
  }
}

export async function logChange(input: ChangeLogInput) {
  const id = generateId();

  let operator = input.operator || 'system';
  let userId = input.userId || null;

  // Resolve operator and userId from session if not provided
  if (!input.operator || !input.userId) {
    const session = await getCurrentSession();
    if (session) {
      operator = session.username || session.name || 'system';
      if (!userId && session.username) {
        try {
          const account = await prisma.account.findUnique({
            where: { username: session.username },
            select: { id: true },
          });
          if (account) {
            userId = account.id;
          }
        } catch (e) {
          console.error('Failed to resolve user_id for change log:', e);
        }
      }
    }
  }

  // Auto-generate description if not provided
  let description = input.description;
  if (!description) {
    const entityName = input.afterState?.name || input.beforeState?.name || '';
    const nameStr = entityName ? ` '${entityName}'` : '';

    switch (input.action) {
      case 'CREATE':
        description = `Created ${input.entityType}${nameStr}`;
        break;
      case 'UPDATE':
        description = `Updated ${input.entityType}${nameStr}`;
        break;
      case 'DELETE':
        description = `Deleted ${input.entityType}${nameStr}`;
        break;
      case 'RESTORE':
        description = `Restored ${input.entityType}${nameStr}`;
        break;
      case 'IMPORT':
        description = `Imported ${input.entityType}`;
        break;
      case 'RESET':
        description = `Reset ${input.entityType}`;
        break;
      default:
        description = `Modified ${input.entityType}`;
    }
  }

  await prisma.changeLog.create({
    data: {
      id,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      projectId: input.projectId ?? null,
      userId,
      operator,
      description,
      beforeState: input.beforeState ?? undefined,
      afterState: input.afterState ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });

  // Dispatch Google Space notification
  try {
    await sendGoogleSpaceNotification({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      projectId: input.projectId,
      userId,
      operator,
      description,
      beforeState: input.beforeState,
      afterState: input.afterState,
      metadata: input.metadata,
    });
  } catch (notificationErr) {
    console.error('[logChange] Notification dispatch error:', notificationErr);
  }
}

export async function getDatabaseSummary() {
  try {
    const projects = await prisma.project.count();
    const collections = await prisma.collection.count();
    const apis = await prisma.api.count();
    const requestScenarios = await prisma.requestScenario.count();
    const responseScenarios = await prisma.responseScenario.count();

    return {
      projects,
      collections,
      apis,
      requestScenarios,
      responseScenarios,
    };
  } catch (error) {
    return { projects: 0, collections: 0, apis: 0, requestScenarios: 0, responseScenarios: 0 };
  }
}
