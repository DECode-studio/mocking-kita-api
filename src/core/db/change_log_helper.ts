import { db } from '@/src/core/db/sqlite-client';
import { generateId } from '@/src/core/utils/uuid';
import { cookies } from 'next/headers';
import { UserSession } from '@/src/domain/auth/entity/user_session';
import { sendGoogleSpaceNotification } from '@/src/core/notification/google_space_notifier';

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
    const cookieStore = await cookies();
    const rawSession = cookieStore.get('mock-api-studio-auth')?.value;
    if (!rawSession) return null;
    return JSON.parse(rawSession) as UserSession;
  } catch {
    return null;
  }
}

export async function logChange(input: ChangeLogInput) {
  const id = generateId();
  const createdAt = new Date().toISOString();

  let operator = input.operator || 'system';
  let userId = input.userId || null;

  // Resolve operator and userId from session if not provided
  if (!input.operator || !input.userId) {
    const session = await getCurrentSession();
    if (session) {
      operator = session.username || session.name || 'system';
      if (!userId && session.username) {
        try {
          const account = db
            .prepare('SELECT id FROM tblAccount WHERE username = ? LIMIT 1')
            .get(session.username) as { id: string } | undefined;
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

  db.prepare(`
    INSERT INTO tblChangeLog (
      id, action, entity_type, entity_id, project_id, user_id, operator, description, before_state, after_state, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.action,
    input.entityType,
    input.entityId ?? null,
    input.projectId ?? null,
    userId,
    operator,
    description,
    input.beforeState ? JSON.stringify(input.beforeState) : null,
    input.afterState ? JSON.stringify(input.afterState) : null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt
  );

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

export function getDatabaseSummary() {
  try {
    const projects = db.prepare('SELECT COUNT(*) as count FROM tblProject').get() as { count: number };
    const collections = db.prepare('SELECT COUNT(*) as count FROM tblCollection').get() as { count: number };
    const apis = db.prepare('SELECT COUNT(*) as count FROM tblApi').get() as { count: number };
    const requestScenarios = db.prepare('SELECT COUNT(*) as count FROM tblRequestScenario').get() as { count: number };
    const responseScenarios = db.prepare('SELECT COUNT(*) as count FROM tblResponseScenario').get() as { count: number };
    
    return {
      projects: projects?.count || 0,
      collections: collections?.count || 0,
      apis: apis?.count || 0,
      requestScenarios: requestScenarios?.count || 0,
      responseScenarios: responseScenarios?.count || 0,
    };
  } catch (error) {
    return { projects: 0, collections: 0, apis: 0, requestScenarios: 0, responseScenarios: 0 };
  }
}
